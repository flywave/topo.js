/**
 * Sketch constraint solver tests — 1:1 port from go-topo sketch_test.go
 * Lines 489-889: TestSketchSolver_SingleConstraint, TestSketchSolver_BetweenConstraint,
 * TestSketchSolver_CombinedConstraints, TestSketchSolver_EdgeCases.
 *
 * TS tests add geometric verification via solve_status().x (DOF vector),
 * which Go tests do not perform.
 *
 * Solver internals (from sketch_solver.cc):
 *   Segment DOF: [x1, y1, x2, y2]  — endpoints
 *   Arc DOF:     [cx, cy, r, a1, a2] — center, radius, start-angle, sweep-angle
 *     arc_first = (cx + r*sin(a1), cy + r*cos(a1))
 *     arc_last  = (cx + r*sin(a1+a2), cy + r*cos(a1+a2))
 *   Total cost = Σ constraint_cost²
 *   fixed_cost = sqrt(Σ(x-x0)²) — penalizes deviation from initial DOFs
 *   status 1-4 = NLopt success; cost may be non-zero when constraints conflict
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// --- WASM singleton --------------------------------------------------------
let tp: any;
let K: any; // SketchConstraintKind

beforeAll(async () => {
    const wasmDir = join(here, "..", "..", "topo-wasm", "src");
    const { default: initTopo } = await import(
        /* @vite-ignore */ join(wasmDir, "topo.full.js")
    );
    const wasmBinary = readFileSync(join(wasmDir, "topo.full.wasm"));
    tp = await initTopo({ wasmBinary });
    (globalThis as any).Workplane = tp.Workplane;
    K = tp.SketchConstraintKind;
});

// --- Helpers ---------------------------------------------------------------
const vec = (x: number, y: number, z: number) => new tp.Vector(x, y, z);

const wp = () => new tp.Workplane("XY", vec(0, 0, 0), undefined);

/** sketch with a single segment (0,0,0)→(10,0,0) */
function makeSegment(tag: string) {
    const sk = wp().sketch();
    sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 0, 0), tag, false);
    return sk;
}

/** sketch with a 3-point arc (5,0)→(0,5)→(-5,0) — half-circle */
function makeCircleEdge(tag: string) {
    const sk = wp().sketch();
    sk.arcByThreePoints(
        vec(5, 0, 0), vec(0, 5, 0), vec(-5, 0, 0),
        tag, false
    );
    return sk;
}

/** sketch with two parallel horizontal segments */
function makeTwoSegments(tag1: string, tag2: string) {
    const sk = wp().sketch();
    sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 0, 0), tag1, false);
    sk.segmentBetweenPoints(vec(0, 10, 0), vec(10, 10, 0), tag2, false);
    return sk;
}

function solve(sk: any) {
    sk.solve();
    const st = sk.solve_status();
    return st;
}

/**
 * Solver converged (NLopt status 1-4).
 * Go tests only check err==nil; we also allow non-zero cost when constraints
 * conflict (FIXED pulls toward initial DOFs while other constraints pull away).
 */
function expectConverged(st: any) {
    expect([1, 2, 3, 4]).toContain(st.status);
}

/** Distance between two 2D points */
function dist2d(a: [number, number], b: [number, number]): number {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

/** Dot product of two 2D vectors */
function dot2d(a: [number, number], b: [number, number]): number {
    return a[0] * b[0] + a[1] * b[1];
}

// =========================================================================
// 1. SingleConstraint
// =========================================================================
describe("TestSketchSolver_SingleConstraint", () => {

    // --- FIXED (0) --------------------------------------------------------
    describe("FIXED", () => {
        it("FIXED on segment — DOFs unchanged, cost ≈ 0", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.FIXED, 0);
            const st = solve(sk);
            expectConverged(st);
            // FIXED only penalizes deviation from initial DOFs; no other constraints
            // → cost = 0 (segment stays at initial position)
            expect(st.cost).toBeLessThan(1e-6);
            const [x1, y1, x2, y2] = st.x[0];
            expect(x1).toBeCloseTo(0, 3);
            expect(y1).toBeCloseTo(0, 3);
            expect(x2).toBeCloseTo(10, 3);
            expect(y2).toBeCloseTo(0, 3);
        });
    });

    // --- FIXED_POINT (1) --------------------------------------------------
    describe("FIXED_POINT", () => {
        it("FIXED_POINT at t=0.5", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.FIXED_POINT, 0.5);
            const st = solve(sk);
            expectConverged(st);
        });
        it("FIXED_POINT at start (t=0)", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.FIXED_POINT, 0.0);
            const st = solve(sk);
            expectConverged(st);
        });
        it("FIXED_POINT at end (t=1)", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.FIXED_POINT, 1.0);
            const st = solve(sk);
            expectConverged(st);
        });
    });

    // --- LENGTH (4) -------------------------------------------------------
    describe("LENGTH", () => {
        it("LENGTH=5 on segment — distance between endpoints ≈ 5", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.LENGTH, 5);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1, y1, x2, y2] = st.x[0];
            expect(dist2d([x1, y1], [x2, y2])).toBeCloseTo(5, 3);
        });
        it("LENGTH=0 on segment — degenerate (Go: t.Logf, not Fatalf)", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.LENGTH, 0);
            try {
                const st = solve(sk);
                expect([1, 2, 3, 4]).toContain(st.status);
            } catch {
                // acceptable — LENGTH=0 is degenerate
            }
        });
    });

    // --- ORIENTATION (7) --------------------------------------------------
    describe("ORIENTATION", () => {
        it("horizontal [1,0] — y1≈y2", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.ORIENTATION, [1, 0]);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1, y1, x2, y2] = st.x[0];
            expect(Math.abs(y1 - y2)).toBeLessThan(0.01);
        });
        it("vertical [0,1] — x1≈x2", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.ORIENTATION, [0, 1]);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1, y1, x2, y2] = st.x[0];
            expect(Math.abs(x1 - x2)).toBeLessThan(0.01);
        });
        it("diagonal [1,1] — direction parallel to (1,1)", () => {
            const sk = makeSegment("e1");
            sk.constrain("e1", K.ORIENTATION, [1, 1]);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1, y1, x2, y2] = st.x[0];
            const dx = x2 - x1, dy = y2 - y1;
            // cross product (dx,dy) × (1,1) ≈ 0
            expect(Math.abs(dx - dy)).toBeLessThan(0.01);
        });
    });

    // --- RADIUS (6) -------------------------------------------------------
    describe("RADIUS", () => {
        it("RADIUS=3 on arc — arc DOF x[2] ≈ 3", () => {
            const sk = makeCircleEdge("a1");
            sk.constrain("a1", K.RADIUS, 3);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            // Arc DOF: [cx, cy, r, a1, a2]
            expect(st.x[0][2]).toBeCloseTo(3, 2);
        });
        it("RADIUS=10 on arc — arc DOF x[2] ≈ 10", () => {
            const sk = makeCircleEdge("a1");
            sk.constrain("a1", K.RADIUS, 10);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            expect(st.x[0][2]).toBeCloseTo(10, 2);
        });
    });

    // --- ARC_ANGLE (8) ----------------------------------------------------
    describe("ARC_ANGLE", () => {
        it("ARC_ANGLE=2.0944 — arc DOF angle2 matches target", () => {
            const sk = makeCircleEdge("a1");
            sk.constrain("a1", K.ARC_ANGLE, 2.0944);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            // arc_angle_cost = abs(angle2 - target); solver minimizes this to 0
            expect(st.x[0][4]).toBeCloseTo(2.0944, 4);
        });
        it("ARC_ANGLE=6.28318 (full circle) — arc DOF angle2 ≈ 2π", () => {
            const sk = makeCircleEdge("a1");
            sk.constrain("a1", K.ARC_ANGLE, 6.28318);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            expect(st.x[0][4]).toBeCloseTo(6.28318, 3);
        });
    });
});

// =========================================================================
// 2. BetweenConstraint
// =========================================================================
describe("TestSketchSolver_BetweenConstraint", () => {

    // --- COINCIDENT (2) ---------------------------------------------------
    it("COINCIDENT line-line (blank value)", () => {
        const sk = makeTwoSegments("e1", "e2");
        sk.constrain("e1", "e2", K.COINCIDENT);
        const st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
    });

    // --- ANGLE (3) --------------------------------------------------------
    describe("ANGLE between segments", () => {
        it("ANGLE=0 rad — parallel, directions parallel", () => {
            const sk = makeTwoSegments("e1", "e2");
            sk.constrain("e1", "e2", K.ANGLE, 0);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
        });
        it("ANGLE=1.5708 rad (90°) — dot product of directions ≈ 0", () => {
            const sk = wp().sketch();
            sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 0, 0), "e1", false);
            sk.segmentBetweenPoints(vec(0, 0, 0), vec(0, 10, 0), "e2", false);
            sk.constrain("e1", "e2", K.ANGLE, 1.5708);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1a, y1a, x1b, y1b] = st.x[0];
            const [x2a, y2a, x2b, y2b] = st.x[1];
            const d1: [number, number] = [x1b - x1a, y1b - y1a];
            const d2: [number, number] = [x2b - x2a, y2b - y2a];
            const len1 = Math.sqrt(d1[0] ** 2 + d1[1] ** 2);
            const len2 = Math.sqrt(d2[0] ** 2 + d2[1] ** 2);
            const cosAngle = dot2d(d1, d2) / (len1 * len2);
            expect(Math.abs(cosAngle)).toBeLessThan(0.05);
        });
        it("ANGLE=0.785398 rad (45°) — cos ≈ cos(45°)", () => {
            const sk = wp().sketch();
            sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 0, 0), "e1", false);
            sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 10, 0), "e2", false);
            sk.constrain("e1", "e2", K.ANGLE, 0.785398);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1a, y1a, x1b, y1b] = st.x[0];
            const [x2a, y2a, x2b, y2b] = st.x[1];
            const d1: [number, number] = [x1b - x1a, y1b - y1a];
            const d2: [number, number] = [x2b - x2a, y2b - y2a];
            const len1 = Math.sqrt(d1[0] ** 2 + d1[1] ** 2);
            const len2 = Math.sqrt(d2[0] ** 2 + d2[1] ** 2);
            const cosAngle = dot2d(d1, d2) / (len1 * len2);
            expect(cosAngle).toBeCloseTo(Math.cos(0.785398), 1);
        });
    });

    // --- DISTANCE (5) -----------------------------------------------------
    describe("DISTANCE between segments", () => {
        it("DISTANCE [0.5,0.5,5] — midpoints ≈ 5 apart", () => {
            const sk = makeTwoSegments("e1", "e2");
            sk.constrain("e1", "e2", K.DISTANCE, [0.5, 0.5, 5]);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1a, y1a, x1b, y1b] = st.x[0];
            const [x2a, y2a, x2b, y2b] = st.x[1];
            // param 0.5 on each segment = midpoint
            const mx1 = (x1a + x1b) / 2, my1 = (y1a + y1b) / 2;
            const mx2 = (x2a + x2b) / 2, my2 = (y2a + y2b) / 2;
            expect(dist2d([mx1, my1], [mx2, my2])).toBeCloseTo(5, 1);
        });
        it("DISTANCE [0.5,0.5,0] — midpoints ≈ 0 apart (coincident)", () => {
            const sk = makeTwoSegments("e1", "e2");
            sk.constrain("e1", "e2", K.DISTANCE, [0.5, 0.5, 0]);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1a, y1a, x1b, y1b] = st.x[0];
            const [x2a, y2a, x2b, y2b] = st.x[1];
            const mx1 = (x1a + x1b) / 2, my1 = (y1a + y1b) / 2;
            const mx2 = (x2a + x2b) / 2, my2 = (y2a + y2b) / 2;
            expect(dist2d([mx1, my1], [mx2, my2])).toBeLessThan(0.1);
        });
        it("DISTANCE [0,0,10] — param [0,0] → start endpoints ≈ 10 apart", () => {
            const sk = makeTwoSegments("e1", "e2");
            sk.constrain("e1", "e2", K.DISTANCE, [0, 0, 10]);
            const st = solve(sk);
            expectConverged(st);
            expect(st.cost).toBeLessThan(1e-6);
            const [x1a, y1a] = st.x[0];
            const [x2a, y2a] = st.x[1];
            expect(dist2d([x1a, y1a], [x2a, y2a])).toBeCloseTo(10, 1);
        });
    });
});

// =========================================================================
// 3. CombinedConstraints
// =========================================================================
describe("TestSketchSolver_CombinedConstraints", () => {

    it("FIXED + LENGTH — compatible constraints (segment already length 10, fixed)", () => {
        const sk = makeSegment("e1");
        sk.constrain("e1", K.FIXED, 0);
        sk.constrain("e1", K.LENGTH, 5);
        const st = solve(sk);
        // FIXED + LENGTH(5) conflict: FIXED pulls DOFs to initial (length=10),
        // LENGTH pulls to 5. NLopt converges (status 4) to a local minimum
        // with non-zero cost — this is expected solver behavior.
        expectConverged(st);
    });

    it("FIXED + ORIENTATION — compatible constraints", () => {
        const sk = makeSegment("e1");
        sk.constrain("e1", K.FIXED, 0);
        sk.constrain("e1", K.ORIENTATION, [0, 1]);
        const st = solve(sk);
        // FIXED pulls DOFs to initial (horizontal), ORIENTATION pulls to vertical.
        // Conflict → local minimum with non-zero cost.
        expectConverged(st);
    });

    it("COINCIDENT + ANGLE — two segments share endpoint, 60° angle", () => {
        const sk = wp().sketch();
        sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 0, 0), "e1", false);
        sk.segmentBetweenPoints(vec(5, 5, 0), vec(15, 5, 0), "e2", false);
        sk.constrain("e1", "e2", K.COINCIDENT);
        sk.constrain("e1", "e2", K.ANGLE, 1.0472);
        const st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
    });

    it("DISTANCE + ANGLE — parallel, 3 apart, same direction", () => {
        const sk = makeTwoSegments("e1", "e2");
        sk.constrain("e1", "e2", K.DISTANCE, [0, 0, 3]);
        sk.constrain("e1", "e2", K.ANGLE, 0);
        const st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
        // param [0,0] = start of each segment
        const [x1a, y1a] = st.x[0];
        const [x2a, y2a] = st.x[1];
        expect(dist2d([x1a, y1a], [x2a, y2a])).toBeCloseTo(3, 1);
    });

    it("LENGTH + ARC_ANGLE — segment length constrained, arc angle constrained", () => {
        const sk = wp().sketch();
        sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 0, 0), "e1", false);
        sk.arcByThreePoints(vec(5, 0, 0), vec(0, 5, 0), vec(-5, 0, 0), "a1", false);
        sk.constrain("e1", K.LENGTH, 8);
        sk.constrain("a1", K.ARC_ANGLE, 2.0944);
        const st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
        // Sketch internally orders arcs (5 DOFs) before segments (4 DOFs).
        // x[0] = arc [cx,cy,r,a1,a2]; x[1] = segment [x1,y1,x2,y2]
        // arc_angle constraint → angle2 ≈ 2.0944
        expect(st.x[0][4]).toBeCloseTo(2.0944, 2);
        // length constraint → segment distance ≈ 8
        const [x1a, y1a, x1b, y1b] = st.x[1];
        expect(dist2d([x1a, y1a], [x1b, y1b])).toBeCloseTo(8, 1);
    });

    it("three constraints chain — COINCIDENT×2 + ANGLE=0 (all parallel)", () => {
        const sk = wp().sketch();
        sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 0, 0), "e1", false);
        sk.segmentBetweenPoints(vec(5, 5, 0), vec(15, 5, 0), "e2", false);
        sk.segmentBetweenPoints(vec(-5, -5, 0), vec(5, -5, 0), "e3", false);
        sk.constrain("e1", "e2", K.COINCIDENT);
        sk.constrain("e2", "e3", K.COINCIDENT);
        sk.constrain("e1", "e3", K.ANGLE, 0);
        const st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
    });
});

// =========================================================================
// 4. EdgeCases
// =========================================================================
describe("TestSketchSolver_EdgeCases", () => {

    it("no constraints — solve on unconstrained segment", () => {
        const sk = makeSegment("e1");
        const st = solve(sk);
        expectConverged(st);
        // No constraints → cost = 0
        expect(st.cost).toBeLessThan(1e-6);
    });

    it("no entities — empty sketch (Go tolerates error)", () => {
        const sk = wp().sketch();
        // nlopt requires ≥1 DOF; this may throw or return a non-success status
        try {
            const st = solve(sk);
            // If it didn't throw, the status may be non-success
        } catch {
            // Expected: solver cannot operate on 0 DOFs
        }
    });

    it("multiple solves — solve()×3, all succeed", () => {
        const sk = makeSegment("e1");
        sk.constrain("e1", K.LENGTH, 5);
        let st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
        st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
        st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
    });

    it("constrain after solve — add ORIENTATION after initial LENGTH solve", () => {
        const sk = makeSegment("e1");
        sk.constrain("e1", K.LENGTH, 5);
        let st = solve(sk);
        expectConverged(st);
        // Add a second constraint and re-solve
        sk.constrain("e1", K.ORIENTATION, [0, 1]);
        st = solve(sk);
        expectConverged(st);
        // Geometric: vertical + length 5
        const [x1, y1, x2, y2] = st.x[0];
        expect(Math.abs(x1 - x2)).toBeLessThan(0.01);
        expect(dist2d([x1, y1], [x2, y2])).toBeCloseTo(5, 2);
    });

    it("overconstrained consistent — LENGTH=10 + ORIENTATION [1,0] + FIXED = compatible", () => {
        const sk = wp().sketch();
        sk.segmentBetweenPoints(vec(0, 0, 0), vec(10, 0, 0), "e1", false);
        sk.constrain("e1", K.LENGTH, 10);
        sk.constrain("e1", K.ORIENTATION, [1, 0]);
        sk.constrain("e1", K.FIXED, 0);
        const st = solve(sk);
        expectConverged(st);
        // All three constraints are compatible with the initial geometry → cost ≈ 0
        expect(st.cost).toBeLessThan(1e-6);
        const [x1, y1, x2, y2] = st.x[0];
        expect(dist2d([x1, y1], [x2, y2])).toBeCloseTo(10, 3);
    });

    it("arc FIXED_POINT at t=0.3", () => {
        const sk = makeCircleEdge("a1");
        sk.constrain("a1", K.FIXED_POINT, 0.3);
        const st = solve(sk);
        expectConverged(st);
    });

    it("arc FIXED — DOFs unchanged", () => {
        const sk = makeCircleEdge("a1");
        sk.constrain("a1", K.FIXED, 0);
        const st = solve(sk);
        expectConverged(st);
        expect(st.cost).toBeLessThan(1e-6);
        // Arc stays at initial DOFs
        expect(st.x[0][0]).toBeCloseTo(0, 3); // cx
        expect(st.x[0][1]).toBeCloseTo(0, 3); // cy
        expect(st.x[0][2]).toBeCloseTo(5, 3); // r
    });
});
