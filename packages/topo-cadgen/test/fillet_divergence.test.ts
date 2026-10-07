// The wasm-fillet divergence probe (selection-topology follow-up): build
// plate + corner-fillet r=5 through the JS interpreter (the real-model tree's
// shape provenance), then fillet EVERY edge r=1 through ShapeOps.fillet —
// the kernel direct call. Go succeeds on the same scenario; this captures the
// wasm failure verbatim (which edges, what error) so the kernel divergence
// can be fixed against a repro, not a number.
import { describe, expect, it } from "vitest";
import { loadKernel, installGlobals } from "../src/engine/kernel.js";
import { stableEdges } from "../../topo-primitives/lib/topo/edge_ref.js";

describe.skipIf(process.env.CADGEN_EDITOR_KERNEL !== "1")("wasm fillet divergence probe", () => {
  it("fillet every edge of a pre-filleted plate r=1 — per-edge verdicts", async () => {
    const tp = await loadKernel();
    installGlobals(tp);
    const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");
    const cq = { workplane: (p?: string) => new CQWorkplane(tp, p ?? "XY") } as any;

    // pad 120x60x10 + corner fillet r=5 — the exact tree provenance.
    const wp = cq.workplane("XY");
    const pts = [[-60, -30], [60, -30], [60, 30], [-60, 30], [-60, -30]]
      .map(([x, y]: number[]) => new tp.gp_Pnt_3(x, y, 0));
    wp.polyline(pts, false, false);
    wp.close();
    let body = wp.extrudeSimple(10);
    body = body.edges("|Z", "").fillet(5);

    let solid = body.vals()[0];
    if (solid?.Solids) {
      const solids = solid.Solids();
      if (solids && solids.length) solid = solids[0];
    }
    expect(solid).toBeTruthy();

    const all = stableEdges(solid) as any[];
    expect(all.length).toBeGreaterThanOrEqual(12);

    const ok: number[] = [];
    const failures: string[] = [];
    for (let i = 0; i < all.length; i++) {
      try {
        const out = tp.ShapeOps.fillet(solid, [all[i]], 1);
        if (out) ok.push(i);
        else failures.push(`edge ${i}: null result`);
      } catch (err) {
        failures.push(`edge ${i}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log(`edges=${all.length} fillet-ok=[${ok.join(",")}] failures=${failures.length}`);
    for (const f of failures) console.log("  fail:", f);
    // Characterization pin (not green): Go fillets every one of these edges
    // fine (TestFilletEdgesOnPreFilletedBody). Until the wasm divergence is
    // fixed, record the verdict so the repro stays executable.
    console.log("PROBE COMPLETE");
    expect(ok.length + failures.length).toBe(all.length);
  }, 300_000);
});
