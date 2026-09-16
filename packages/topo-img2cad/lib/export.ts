/**
 * Writing the finished body out as STEP and STL.
 *
 * Two very different files for two different consumers: STEP carries the exact
 * BREP with its analytic surfaces, STL carries a triangulation of it. STEP is the
 * one that stays editable and is what a CAD system should be handed; STL is
 * what a slicer or a viewer wants.
 *
 * The kernel writes into Emscripten's in-memory filesystem, not the host's, so
 * every export is written to `/tmp` inside the sandbox and read back out through
 * `FS.readFile`. Writing straight to a host path produces no file at all and a
 * `true` return value, which is worse than an error.
 *
 * Each file is then checked for the shape the format actually implies, because
 * a writer that fails can leave a truncated file behind: a STEP that never
 * terminates, or an STL whose length is not a whole number of triangles. Those
 * are reported as failures rather than handed over as deliverables.
 */

import { mkdirSync, writeFileSync } from "fs";
import { extname, join } from "path";
import { validateGeometry } from "./validators/geometric.js";

export type ExportFormat = "step" | "stl";

export interface ExportOptions {
  /** Host directory to write into. Created if missing. */
  outDir: string;
  /** File name stem, without extension. Sanitized before use. */
  basename: string;
  /** Formats to write. Defaults to both. */
  formats?: ExportFormat[];
  /**
   * STL chord tolerance in model units (mm here).
   *
   * Smaller is finer and larger. The kernel meshes the body at this deflection,
   * so it is also what decides the file size.
   */
  stlDeflection?: number;
}

export interface ExportedFile {
  format: ExportFormat;
  path: string;
  bytes: number;
  /** Format-specific facts, e.g. the STL's triangle count. */
  detail: Record<string, number>;
}

export interface ExportResult {
  files: ExportedFile[];
  failures: Array<{ format: ExportFormat; reason: string }>;
  notes: string[];
}

/** Where inside the sandbox the kernel is asked to write. */
const MEMFS_DIR = "/tmp/img2cad-export";

interface KernelFs {
  mkdirTree(path: string): void;
  readFile(path: string, opts?: { encoding: "binary" }): Uint8Array;
  unlink(path: string): void;
}

interface ExportableShape {
  exportStep(path: string): boolean;
  writeToStl(path: string, deflection?: number): boolean;
}

/**
 * Write the body as STEP and STL.
 *
 * Returns what was written and what was not, rather than throwing: a run that
 * produced a valid model but could not write one of the two formats is still a
 * run worth finishing, and the caller decides what to do about the gap.
 */
export function exportShape(
  tp: unknown,
  shape: unknown,
  opts: ExportOptions,
): ExportResult {
  const files: ExportedFile[] = [];
  const failures: Array<{ format: ExportFormat; reason: string }> = [];
  const notes: string[] = [];

  const fs = (tp as { FS?: KernelFs } | undefined)?.FS;
  if (!fs || typeof fs.readFile !== "function") {
    return {
      files,
      failures: [],
      notes: [
        "the kernel exposes no filesystem, so nothing can be read back out of it — export skipped",
      ],
    };
  }

  const exportable = shape as ExportableShape | null | undefined;
  if (exportable == null || typeof exportable.exportStep !== "function") {
    return {
      files,
      failures: [],
      notes: ["there is no body to export"],
    };
  }

  let sandboxReady = false;
  try {
    fs.mkdirTree(MEMFS_DIR);
    sandboxReady = true;
  } catch (e) {
    failures.push({
      format: "step",
      reason: `the sandbox filesystem is not usable: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
  if (!sandboxReady) return { files, failures, notes };

  mkdirSync(opts.outDir, { recursive: true });
  const stem = sanitizeBasename(opts.basename);
  const formats = opts.formats ?? ["step", "stl"];
  const deflection = opts.stlDeflection ?? 0.1;

  for (const format of formats) {
    const memPath = `${MEMFS_DIR}/${stem}.${format}`;
    const hostPath = join(opts.outDir, `${stem}.${format}`);

    let wrote = false;
    try {
      wrote = format === "step"
        ? exportable.exportStep(memPath)
        : exportable.writeToStl(memPath, deflection);
    } catch (e) {
      failures.push({ format, reason: e instanceof Error ? e.message : String(e) });
      continue;
    }

    if (!wrote) {
      failures.push({
        format,
        reason: `the kernel reported the ${format.toUpperCase()} write failed`,
      });
      continue;
    }

    let bytes: Uint8Array;
    try {
      bytes = fs.readFile(memPath);
    } catch (e) {
      failures.push({
        format,
        reason: `the kernel wrote to its own filesystem but the result could not be read back (${e instanceof Error ? e.message : String(e)})`,
      });
      continue;
    }

    const defect = format === "step" ? stepDefect(bytes) : stlDefect(bytes);
    if (defect) {
      failures.push({ format, reason: defect });
      continue;
    }

    writeFileSync(hostPath, bytes);
    const detail =
      format === "step" ? stepDetail(bytes) : { ...stlDetail(bytes), watertight: 0 };

    if (format === "stl") {
      // A structurally valid mesh can still be an open one. The kernel says so
      // itself — "N faces have been skipped due to null triangulation" — and the
      // result is a file that looks fine, prints wrong, and slices worse. Check
      // the mesh against the solid it came from rather than trusting the header.
      const enclosed = meshVolume(bytes);
      const solid = validateGeometry(tp, exportable).report.volume;
      if (enclosed !== null && solid !== undefined && solid > 0) {
        const ratio = enclosed / solid;
        detail.watertight = Math.abs(ratio - 1) <= 0.01 ? 1 : 0;
        detail.volumeRatio = Number(ratio.toFixed(4));
        if (detail.watertight === 0) {
          notes.push(
            `the STL is not watertight: its triangles enclose ${(ratio * 100).toFixed(1)}% of the solid's volume (${enclosed.toFixed(0)} of ${solid.toFixed(0)}), which is what a mesh looks like when the kernel skipped faces it could not triangulate. The STEP is unaffected; treat the STL as unusable until it closes`,
          );
        }
      }
    }

    files.push({ format, path: hostPath, bytes: bytes.length, detail });

    try {
      fs.unlink(memPath);
    } catch {
      // Leaving it in the sandbox is harmless; it dies with the instance.
    }
  }

  if (formats.includes("stl")) {
    notes.push(
      `STL is written binary at ${deflection} unit deflection; it carries a triangulation, so it cannot be edited the way the STEP can`,
    );
  }

  return { files, failures, notes };
}

/**
 * Make a tree's name safe to use as a file name.
 *
 * The name comes from the feature tree, which a model authored — `../../` in it
 * must not be able to place a file outside the output directory.
 */
export function sanitizeBasename(name: string): string {
  const cleaned = name
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^[._]+/, "")
    .replace(/[._]+$/, "");
  return cleaned.slice(0, 80) || "model";
}

/** Why this STEP is not usable, or null when it is. */
function stepDefect(bytes: Uint8Array): string | null {
  const text = Buffer.from(bytes).toString("utf8");
  if (!text.startsWith("ISO-10303-21;")) {
    return "the written file does not begin with an ISO-10303-21 header — it is not a STEP file";
  }
  if (!text.includes("DATA;")) {
    return "the STEP file has a header but no DATA section";
  }
  if (!text.trimEnd().endsWith("END-ISO-10303-21;")) {
    return "the STEP file is truncated: it never reaches its END-ISO-10303-21 terminator";
  }
  return null;
}

/** Why this STL is not usable, or null when it is. */
function stlDefect(bytes: Uint8Array): string | null {
  if (bytes.length < 84) {
    return `binary STL needs at least an 84 byte header and count, and this is ${bytes.length} bytes`;
  }
  const triangles = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true);
  if (triangles === 0) {
    return "the STL contains no triangles — the body was not meshed";
  }
  const expected = 84 + triangles * 50;
  if (bytes.length !== expected) {
    return `the STL is truncated: ${triangles} triangles need ${expected} bytes and the file has ${bytes.length}`;
  }
  return null;
}

function stepDetail(bytes: Uint8Array): Record<string, number> {
  const text = Buffer.from(bytes).toString("utf8");
  // OCCT writes `#12 = TYPE(...)`, with padding before the equals sign.
  return { entities: (text.match(/^#\d+\s*=/gm) ?? []).length };
}

/**
 * Signed volume enclosed by a binary STL's triangles.
 *
 * The divergence theorem returns the true volume only for a closed mesh wound
 * outward, so comparing it with the solid's own volume answers "is this mesh
 * usable" rather than "did the writer finish".
 */
function meshVolume(bytes: Uint8Array): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const triangles = view.getUint32(80, true);
  let volume = 0;
  for (let i = 0; i < triangles; i++) {
    const base = 84 + i * 50 + 12;
    const p: number[][] = [];
    for (let v = 0; v < 3; v++) {
      const o = base + v * 12;
      p.push([view.getFloat32(o, true), view.getFloat32(o + 4, true), view.getFloat32(o + 8, true)]);
    }
    volume += (
      p[0][0] * (p[1][1] * p[2][2] - p[1][2] * p[2][1]) -
      p[0][1] * (p[1][0] * p[2][2] - p[1][2] * p[2][0]) +
      p[0][2] * (p[1][0] * p[2][1] - p[1][1] * p[2][0])
    ) / 6;
  }
  return Number.isFinite(volume) ? volume : null;
}

function stlDetail(bytes: Uint8Array): Record<string, number> {
  const triangles = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true);
  return { triangles };
}

/** The extension a format writes, for callers reporting paths. */
export function formatExtension(format: ExportFormat): string {
  return format === "step" ? ".step" : ".stl";
}

/** True when `path` looks like a format this module writes. */
export function formatOfPath(path: string): ExportFormat | null {
  const ext = extname(path).toLowerCase();
  if (ext === ".step" || ext === ".stp") return "step";
  if (ext === ".stl") return "stl";
  return null;
}
