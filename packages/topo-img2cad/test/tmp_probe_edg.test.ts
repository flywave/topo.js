import { describe, it } from "vitest";
import { measureEdgeDistance } from "../lib/validators/edge_distance.js";
import type { MeshLike } from "../lib/cad/project.js";

const asShape = (mesh: MeshLike | null) => ({ mesh: () => mesh });

function lineMesh(): MeshLike {
    return { vertices: [[0, 0, 0, 60, 0, 0, 30, 0, 0]], triangles: [[0, 1, 2]] };
}
function untriMesh(): MeshLike {
    const hx = 40, hy = 30, hz = 10;
    const c = (sx: number, sy: number, sz: number) => [sx * hx, sy * hy, sz * hz];
    const f = (a: number[], b: number[], cc: number[], d: number[]) => ({ positions: [...a, ...b, ...cc, ...d], indices: [3, 0, 1, 3, 1, 2] });
    const faces = [
        f(c(-1, -1, -1), c(1, -1, -1), c(1, 1, -1), c(-1, 1, -1)),
        f(c(-1, -1, 1), c(1, -1, 1), c(1, 1, 1), c(-1, 1, 1)),
    ];
    return { vertices: faces.map((x) => x.positions), triangles: faces.map(() => [0, 0, 0]) };
}

function probe(name: string, mesh: MeshLike) {
    const r = measureEdgeDistance(asShape(mesh) as any, {
        view: "top",
        ink: rect(120, 100),
        inkWidth: 120,
        inkHeight: 100,
        width: 160,
        height: 160,
    });
    console.log(name, JSON.stringify({
        codes: r.issues.map((i) => i.code),
        compared: r.compared,
        modelBounds: (r as any).modelBounds,
    }));
}

function rect(w: number, h: number): Uint8Array {
    const m = new Uint8Array(w * h);
    for (let y = 10; y <= h - 11; y++) for (let x = 10; x <= w - 11; x++) {
        if (x < 12 || x > w - 13 || y < 12 || y > h - 13) m[y * w + x] = 1;
    }
    return m;
}

describe("probe", () => {
    it("probes", () => {
        probe("line", lineMesh());
        probe("untri", untriMesh());
    });
});
