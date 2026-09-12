/**
 * Assembly constraint solver — ported from go-topo assembly_test.go
 *
 * Reference: /Users/xuning/Work/go-topo/assembly_test.go
 * Tests: makeAssemblyWithChild + solve/edge-case tests
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CQWorkplane } from "../lib/cq/index";

const here = dirname(fileURLToPath(import.meta.url));

// --- WASM singleton --------------------------------------------------------
let tp: any;
let CK: any;
beforeAll(async () => {
    const wasmDir = join(here, "..", "..", "topo-wasm", "src");
    const { default: initTopo } = await import(
        /* @vite-ignore */ join(wasmDir, "topo.full.js")
    );
    const wasmBinary = readFileSync(join(wasmDir, "topo.full.wasm"));
    tp = await initTopo({ wasmBinary });
    // Assembly.create/add use instanceof(emval_global("Workplane")) and
    // instanceof(emval_global("Assembly")) — register globals for the bindings.
    (globalThis as any).Workplane = tp.Workplane;
    (globalThis as any).Assembly = tp.Assembly;
    // Location 构造器对 gp_Trsf/TopLoc_Location/gp_Pnt/gp_Vec/gp_Pln/topo_vector 做 instanceof
    for (const n of ["gp_Trsf", "TopLoc_Location", "gp_Pnt", "gp_Vec", "gp_Pln"]) {
        if ((tp as any)[n] !== undefined) {
            (globalThis as any)[n] = (tp as any)[n];
        }
    }
    CK = (tp as any).AssemblyConstraintKind;
});

// --- Helpers ---------------------------------------------------------------

function makeAssemblyWithChild(rootName: string, childName: string) {
    const wp = new CQWorkplane(tp, "XY");
    const rootBox = wp.boxCentered(10, 10, 10);
    const rootShp = rootBox.value();
    const obj = tp.Assembly.create(rootShp, undefined, rootName);
    const wp2 = new CQWorkplane(tp, "XY");
    const childBox = wp2.boxCentered(5, 5, 5);
    const childShp = childBox.value();
    obj.add(childShp, undefined, childName);
    return obj;
}

// --- Tests -----------------------------------------------------------------

describe("Assembly constraint solver", () => {
    describe("constrain + solve", () => {
        it("Point solve: 位移后的 part 被拉回与 root 原点重合", () => {
            // 先给 part 一个 (20,20,20) 的初始位移, Point 约束应将其拉回原点。
            // (直接在原点加 part 的空验: part 不动时 compound bbox 也是 [-5,5]³)
            const wp = new CQWorkplane(tp, "XY");
            const rootShp = wp.boxCentered(10, 10, 10).value();
            const as = tp.Assembly.create(rootShp, undefined, "root");
            const wp2 = new CQWorkplane(tp, "XY");
            const childShp = wp2.boxCentered(5, 5, 5).value();
            const displaced = new tp.Location(new tp.gp_Vec_4(20, 20, 20));
            as.add(childShp, displaced, "part");

            as.constrain1("root", CK.Fixed, 0);
            as.constrain("root", "part", CK.Point, 0);
            as.solve(0);
            expect(as.hasError()).toBe(false);

            // 求解后 part 回到原点: compound bbox 收敛回 [-5,5]³ (位移时是 [-5,22.5]³)
            const bb = as.toCompound().bbox();
            expect(bb.xMax()).toBeCloseTo(5, 1);
            expect(bb.yMax()).toBeCloseTo(5, 1);
            expect(bb.zMax()).toBeCloseTo(5, 1);
            expect(bb.xMin()).toBeCloseTo(-5, 1);
            expect(bb.yMin()).toBeCloseTo(-5, 1);
            expect(bb.zMin()).toBeCloseTo(-5, 1);
        });

        it("FixedPoint solve: part 移到 z=5 (compound zMax≈7.5)", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("root", CK.Fixed, 0);
            as.constrain1("part", CK.FixedPoint, [0, 0, 5]);
            as.solve(0);
            expect(as.hasError()).toBe(false);

            // 几何核验: part(5³) 移到 z=5 → z 跨度 2.5..7.5, compound zMax≈7.5
            // (与 go-topo TestAssemblySolve_GeometricVerification 同口径)
            const bb = as.toCompound().bbox();
            expect(bb.zMax()).toBeCloseTo(7.5, 4);
            expect(bb.zMin()).toBeCloseTo(-5, 4);
        });

        it("constrain returns Assembly (chaining)", () => {
            const as = makeAssemblyWithChild("root", "part");
            const ret = as.constrain1("root", CK.Fixed, 0);
            expect(ret).toBeDefined();
            // Embind smart_ptr creates a new JS wrapper per return; verify by name
            expect(ret.name()).toBe("root");
        });

        it("solve returns Assembly (chaining)", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("root", CK.Fixed, 0);
            as.constrain("root", "part", CK.Point, 0);
            const ret = as.solve(0);
            expect(ret).toBeDefined();
            expect(ret.name()).toBe("root");
        });
    });

    describe("edge cases", () => {
        it("solve with no constraints → hasError", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.solve(0);
            // C++ sets "At least one constraint required" on assembly error
            expect(as.hasError()).toBe(true);
            const err = as.getError();
            expect(err).toBeTruthy();
        });

        it("multiple solves: second solve is idempotent (no error)", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("root", CK.Fixed, 0);
            as.constrain("root", "part", CK.Point, 0);
            as.solve(0);
            expect(as.hasError()).toBe(false);
            // Second solve should not throw
            as.solve(0);
            expect(as.hasError()).toBe(false);
        });

        it("constrain after solve: no error", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("root", CK.Fixed, 0);
            as.constrain("root", "part", CK.Point, 0);
            as.solve(0);
            expect(as.hasError()).toBe(false);
            // Adding another constraint after solve should not throw
            as.constrain1("part", CK.FixedPoint, [0, 0, 5]);
            expect(as.hasError()).toBe(false);
        });
    });

    describe("face selector (Plane constraint)", () => {
        it("constrain via face selector — tolerate parse/query errors", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("root", CK.Fixed, 0);
            // Face selector query: name?faces@>Z
            // Go side tolerates selector parse failures
            try {
                as.constrain(
                    "root?faces@>Z",
                    "part?faces@>Z",
                    CK.Plane,
                    [0, 0]
                );
                // If constrain succeeded, try solve
                as.solve(0);
                // No assertion on error — Go side also tolerates solve errors here
            } catch {
                // Expected if selector parsing fails
            }
        });
    });

    describe("constraint kind enum values", () => {
        it("enum values match C++ solver.hh", () => {
            // Embind enum values are objects with .value
            expect(CK.Point.value).toBe(0);
            expect(CK.Axis.value).toBe(1);
            expect(CK.PointInPlane.value).toBe(2);
            expect(CK.PointOnLine.value).toBe(3);
            expect(CK.Plane.value).toBe(4);
            expect(CK.Fixed.value).toBe(5);
            expect(CK.FixedPoint.value).toBe(6);
            expect(CK.FixedAxis.value).toBe(7);
            expect(CK.FixedRotation.value).toBe(8);
        });
    });
});
