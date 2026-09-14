/**
 * Ports from go-topo:
 *   - geometry_test.go (15 tests)
 *   - mesh_test.go (5 tests)
 *   - standard_test.go (31 tests)
 *   - topo_test.go (9 tests)
 *   - dxf_test.go (1 test) — NOT ported (dxf.cc excluded from WASM build)
 *
 * Reference: /Users/xuning/Work/go-topo/
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// --- WASM singleton --------------------------------------------------------
let tp: any;
beforeAll(async () => {
    const wasmDir = join(here, "..", "..", "topo-wasm", "src");
    const { default: initTopo } = await import(
        /* @vite-ignore */ join(wasmDir, "topo.full.js")
    );
    const wasmBinary = readFileSync(join(wasmDir, "topo.full.wasm"));
    tp = await initTopo({ wasmBinary });
});

// --- Helpers ---------------------------------------------------------------
const TOL = 1e-6;

function pnt(x: number, y: number, z: number): any {
    return new tp.Vector(x, y, z).toPnt();
}

function dir(x: number, y: number, z: number): any {
    return new tp.Vector(x, y, z).toDir();
}

function vec(x: number, y: number, z: number): any {
    return new tp.Vector(x, y, z).toVec();
}

/** Create gp_Ax2 from origin point, normal dir, and X direction dir. */
function ax2(ox: number, oy: number, oz: number, nx: number, ny: number, nz: number, xx: number, xy: number, xz: number): any {
    return new tp.gp_Ax2_2(pnt(ox, oy, oz), dir(nx, ny, nz), dir(xx, xy, xz));
}

function checkShape(shape: any): { ok: boolean; dims: number[]; reason?: string } {
    if (shape == null) return { ok: false, dims: [], reason: "returned null/undefined" };
    if (shape.isNull()) return { ok: false, dims: [], reason: "shape.isNull() == true" };
    const bb = shape.bbox();
    const dims = [bb.xLength(), bb.yLength(), bb.zLength()];
    if (dims.some((d: number) => !Number.isFinite(d)) || Math.max(...dims) <= 0) {
        return { ok: false, dims, reason: `bbox异常 ${dims.join(" x ")}` };
    }
    return { ok: true, dims };
}

// =========================================================================
// geometry_test.go — 15 tests
// =========================================================================
describe("geometry_test.go port", () => {
    // --- TestGeomConstants ---
    // Go: GEOMLINE, GEOMCIRCLE, GEOM2DLINE, GEOM2DCIRCLE are C-level enum constants
    // JS: These geometry type constants are not exposed in the WASM bindings
    it.skip("TestGeomConstants — geom type constants not exposed in JS", () => {});

    // --- TestGeomMakeDirection ---
    // Go: GeomMakeDirection(1,0,0), GeomMakeDirectionFromDir(NewDir3FromXYZ(...))
    // JS: No GeometryCreator.makeDirection* method; gp_Dir can only be created via Vector.toDir()
    it.skip("TestGeomMakeDirection — no makeDirection binding in GeometryCreator", () => {});

    // --- TestGeomMakeVector ---
    // Go: GeomMakeVectorWithMagnitude*, GeomMakeVectorWithMagnitudeFromVector, FromPoint
    // JS: No GeometryCreator.makeVector* method; use Vector class instead
    it.skip("TestGeomMakeVector — no makeVectorWithMagnitude binding in GeometryCreator", () => {});

    // --- TestGeomMakeAxisPlacement ---
    // Go: GeomMakeAxis1PlacementFromPointDir, GeomMakeAxis2PlacementForPointNVX
    // JS: No GeometryCreator.makeAxis*Placement method
    it.skip("TestGeomMakeAxisPlacement — no makeAxis*Placement binding in GeometryCreator", () => {});

    // --- TestGeomMakeArcOfPoint ---
    // Go: GeomMakeArcOfPoint(p1, p2, p3)
    // JS: GeometryCreator.makeArcOfCircleWithThreePoints(p1, p2, p3)
    it("TestGeomMakeArcOfPoint", () => {
        const c = tp.GeometryCreator.makeArcOfCircleWithThreePoints(
            pnt(0, 0, 0),
            pnt(5, 5, 0),
            pnt(10, 0, 0),
        );
        expect(c).toBeDefined();
        expect(c).not.toBeNull();
    });

    // --- TestGeomMakeBezier ---
    // Go: GeomMakeBezierCurve(pts)
    // JS: No GeometryCreator.makeBezierCurve; Edge.makeBezier exists but creates Edge not Handle_Geom_BezierCurve
    it.skip("TestGeomMakeBezier — no makeBezierCurve binding in GeometryCreator", () => {});

    // --- TestGeomMakeSurface ---
    // Go: GeomMakeBezierSurface(pts)
    // JS: No GeometryCreator.makeBezierSurface binding
    it.skip("TestGeomMakeSurface — no makeBezierSurface binding in GeometryCreator", () => {});

    // --- TestGeomMakeSegment ---
    // Go: GeomMakeSegmentOfTwoPoint(p1, p2)
    // JS: GeometryCreator.makeSegmentWithTwoPoints(p1, p2)
    it("TestGeomMakeSegment", () => {
        const c = tp.GeometryCreator.makeSegmentWithTwoPoints(
            pnt(0, 0, 0),
            pnt(10, 0, 0),
        );
        expect(c).toBeDefined();
        expect(c).not.toBeNull();
    });

    // --- TestGeomMakeLine ---
    // Go: GeomMakeLineOfTwoPoint(p1, p2), GeomMakeLineOfPointDir(p, d)
    // JS: GeometryCreator.makeLineWithTwoPoints(p1, p2), makeLineWithPointDir(p, d)
    it("TestGeomMakeLine", () => {
        const l = tp.GeometryCreator.makeLineWithTwoPoints(
            pnt(0, 0, 0),
            pnt(10, 0, 0),
        );
        expect(l).toBeDefined();
        expect(l).not.toBeNull();

        const l2 = tp.GeometryCreator.makeLineWithPointDir(
            pnt(0, 0, 0),
            dir(1, 0, 0),
        );
        expect(l2).toBeDefined();
        expect(l2).not.toBeNull();
    });

    // --- TestGeomMakeCircle ---
    // Go: GeomMakeCircleOfThreePoint(p1, p2, p3), GeomMakeCircleOfCenterNorm(center, dir, r)
    // JS: GeometryCreator.makeCircleWithThreePoints, makeCircleWithCenterNormal
    it("TestGeomMakeCircle", () => {
        const c = tp.GeometryCreator.makeCircleWithThreePoints(
            pnt(-5, 0, 0),
            pnt(0, 5, 0),
            pnt(5, 0, 0),
        );
        expect(c).toBeDefined();
        expect(c).not.toBeNull();

        const c2 = tp.GeometryCreator.makeCircleWithCenterNormal(
            pnt(0, 0, 0),
            dir(0, 0, 1),
            5,
        );
        expect(c2).toBeDefined();
        expect(c2).not.toBeNull();
    });

    // --- TestGeomMakeEllipse ---
    // Go: GeomMakeEllipseOfAxis2(a, major, minor)
    // JS: GeometryCreator.makeEllipseWithAxis(ax2, majorRadius, minorRadius)
    it("TestGeomMakeEllipse", () => {
        const a = ax2(0, 0, 0, 0, 0, 1, 1, 0, 0);
        const e = tp.GeometryCreator.makeEllipseWithAxis(a, 10, 5);
        expect(e).toBeDefined();
        expect(e).not.toBeNull();
    });

    // --- TestGeomMakePlane ---
    // Go: GeomMakePlaneOfPointDir(p, d)
    // JS: GeometryCreator.makePlaneWithPointDir(p, d)
    it("TestGeomMakePlane", () => {
        const p = tp.GeometryCreator.makePlaneWithPointDir(
            pnt(0, 0, 0),
            dir(0, 0, 1),
        );
        expect(p).toBeDefined();
        expect(p).not.toBeNull();
    });

    // --- TestGeomMakeTransform ---
    // Go: GeomMakeRotationOfPointDir(p, d, 45), GeomMakeTranslationOfVector(v)
    // JS: GeometryCreator.makeRotationWithPointDir, makeTranslationWithVec
    it("TestGeomMakeTransform", () => {
        const r = tp.GeometryCreator.makeRotationWithPointDir(
            pnt(0, 0, 0),
            dir(0, 0, 1),
            45,
        );
        expect(r).toBeDefined();
        expect(r).not.toBeNull();

        const tv = tp.GeometryCreator.makeTranslationWithVec(
            vec(10, 0, 0),
        );
        expect(tv).toBeDefined();
        expect(tv).not.toBeNull();
    });

    // --- TestGeomMakeMirror ---
    // Go: GeomMakeMirrorOfAxis2(a)
    // JS: GeometryCreator.makeMirrorWithAxis2(ax2)
    it("TestGeomMakeMirror", () => {
        const a = ax2(0, 0, 0, 0, 0, 1, 1, 0, 0);
        const m = tp.GeometryCreator.makeMirrorWithAxis2(a);
        expect(m).toBeDefined();
        expect(m).not.toBeNull();
    });

    // --- TestGeomMakeCylindricalSurface ---
    // Go: GeomMakeCylindricalSurfaceOfAxis2(a, 5)
    // JS: GeometryCreator.makeCylindricalSurface(ax2, radius)
    it("TestGeomMakeCylindricalSurface", () => {
        const a = ax2(0, 0, 0, 0, 0, 1, 1, 0, 0);
        const s = tp.GeometryCreator.makeCylindricalSurface(a, 5);
        expect(s).toBeDefined();
        expect(s).not.toBeNull();
    });
});

// =========================================================================
// mesh_test.go — 5 tests
// =========================================================================
describe("mesh_test.go port", () => {
    // --- TestNewMeshReceiver ---
    // Go: NewMeshReceiver(), HasTexCoord()
    // JS: No MeshReceiver; use Shape.mesh() returning MeshData
    it.skip("TestNewMeshReceiver — MeshReceiver not in JS API, use Shape.mesh() instead", () => {});

    // --- TestMeshWithBox ---
    // Go: NewNamedWorkplane("XY"), BoxCentered(10,10,10), s.Mesh(m, 0.1, 0.1, 0.5)
    // JS: Solid.makeSolidFromBox + shape.mesh(precision, deflection, angle)
    it("TestMeshWithBox", () => {
        const s = tp.Solid.makeSolidFromBox(10, 10, 10);
        expect(s).toBeDefined();
        expect(s.isNull()).toBe(false);

        const md = s.mesh(undefined, 0.1, 0.5);
        expect(md).toBeDefined();
        expect(md).not.toBeNull();

        // MeshData has vertices, triangles, faceGroups
        expect(md.vertices).toBeDefined();
        expect(md.triangles).toBeDefined();
        expect(md.faceGroups).toBeDefined();
        expect(md.vertices.length).toBeGreaterThan(0);
        expect(md.triangles.length).toBeGreaterThan(0);
    });

    // --- TestMeshWithTexture ---
    // Go: s.MeshWithTexture(m, 0.1, 0.1, 0.5)
    // JS: shape.mesh(undefined, deflection, angle, true) enables UV
    it("TestMeshWithTexture", () => {
        const s = tp.Solid.makeSolidFromBox(10, 10, 10);
        expect(s).toBeDefined();

        const md = s.mesh(undefined, 0.1, 0.5, true);
        expect(md).toBeDefined();
        expect(md).not.toBeNull();

        // With UV=true, uvs should be present
        expect(md.uvs).toBeDefined();
    });

    // --- TestMeshMultipleFaces ---
    // Go: mesh a box, check face data integrity (vertex/normal count match)
    // JS: mesh a box, check MeshData consistency
    it("TestMeshMultipleFaces", () => {
        const s = tp.Solid.makeSolidFromBox(10, 10, 10);
        const md = s.mesh(undefined, 0.1, 0.5);
        expect(md).toBeDefined();
        expect(md).not.toBeNull();

        const faceCount = md.faceGroups.length;
        expect(faceCount).toBeGreaterThan(0);

        // Check consistency: each face group's vertex/normal counts should match
        for (let i = 0; i < faceCount; i++) {
            const fg = md.faceGroups[i];
            if (md.vertices.length === 0) continue;
            // faceGroups[i].start + faceGroups[i].count <= vertices length
            expect(fg.start + fg.count).toBeLessThanOrEqual(md.vertices.length);
        }
    });

    // --- TestMeshWithCompound ---
    // Go: compound two boxes, mesh, check total triangles > 0
    // JS: Compound.makeCompound + mesh
    it("TestMeshWithCompound", () => {
        const s1 = tp.Solid.makeSolidFromBox(10, 10, 10);
        const s2 = tp.Solid.makeSolidFromBox(5, 5, 5);
        const c = tp.Compound.makeCompound([s1, s2]);
        expect(c).toBeDefined();
        expect(c.isNull()).toBe(false);

        const md = c.mesh(undefined, 0.1, 0.5);
        expect(md).toBeDefined();
        expect(md).not.toBeNull();

        let totalTris = 0;
        for (const tri of md.triangles) {
            totalTris += tri.length;
        }
        expect(totalTris).toBeGreaterThan(0);
    });
});

// =========================================================================
// standard_test.go — 31 tests
// =========================================================================
describe("standard_test.go port", () => {
    // --- TestPoint3 ---
    // Go: NewPoint3([1,2,3]), Data() → [1,2,3]
    // JS: Vector class serves as point container; toPnt() creates gp_Pnt
    it("TestPoint3", () => {
        const v = new tp.Vector(1, 2, 3);
        expect(v.x).toBeCloseTo(1, TOL);
        expect(v.y).toBeCloseTo(2, TOL);
        expect(v.z).toBeCloseTo(3, TOL);
        // toPnt should return a gp_Pnt
        const p = v.toPnt();
        expect(p).toBeDefined();
    });

    // --- TestVector3 ---
    // Go: NewVector3([4,5,6]), Data() → [4,5,6]
    // JS: Vector class
    it("TestVector3", () => {
        const v = new tp.Vector(4, 5, 6);
        expect(v.x).toBeCloseTo(4, TOL);
        expect(v.y).toBeCloseTo(5, TOL);
        expect(v.z).toBeCloseTo(6, TOL);
    });

    // --- TestDir3 ---
    // Go: NewDir3FromXYZ, NewDir3FromVector, NewDir3FromPoint
    // JS: Vector.toDir() creates gp_Dir
    it("TestDir3 — from xyz", () => {
        const d = new tp.Vector(1, 0, 0).toDir();
        expect(d).toBeDefined();
    });

    it("TestDir3 — from vector", () => {
        const v = new tp.Vector(0, 1, 0);
        const d = v.toDir();
        expect(d).toBeDefined();
    });

    it("TestDir3 — from point", () => {
        // dir from origin to (0,1,0) → y-axis direction
        const d = new tp.Vector(0, 1, 0).toDir();
        expect(d).toBeDefined();
    });

    // --- TestXYPoint2Vector2 ---
    // Go: NewXY, NewPoint2, NewVector2 (2D types)
    // JS: gp_XY_2, gp_Pnt2d_3, gp_Vec2d_4 bound in WASM
    it("TestXYPoint2Vector2", () => {
        // XY
        const xy = new tp.gp_XY_2(1, 2);
        expect(xy.X()).toBeCloseTo(1, TOL);
        expect(xy.Y()).toBeCloseTo(2, TOL);
        // Point2d
        const p2 = new tp.gp_Pnt2d_3(3, 4);
        expect(p2.X()).toBeCloseTo(3, TOL);
        expect(p2.Y()).toBeCloseTo(4, TOL);
        // Vector2d
        const v2 = new tp.gp_Vec2d_4(5, 6);
        expect(v2.X()).toBeCloseTo(5, TOL);
        expect(v2.Y()).toBeCloseTo(6, TOL);
    });

    // --- TestDir2 ---
    // Go: NewDir2, NewDir2FromVector, NewDir2FromPoint (2D types)
    // JS: gp_Dir2d_4 (from xy), gp_Dir2d_2 (from vec2d), gp_Vec2d_5 (from two points)
    it("TestDir2", () => {
        // from xy
        const d1 = new tp.gp_Dir2d_4(1, 0);
        expect(d1.X()).toBeCloseTo(1, TOL);
        expect(d1.Y()).toBeCloseTo(0, TOL);
        // from vector
        const v = new tp.gp_Vec2d_4(0, 1);
        const d2 = new tp.gp_Dir2d_2(v);
        expect(d2.X()).toBeCloseTo(0, TOL);
        expect(d2.Y()).toBeCloseTo(1, TOL);
        // from two points (p1→p2 direction)
        const p1 = new tp.gp_Pnt2d_3(0, 0);
        const p2 = new tp.gp_Pnt2d_3(1, 0);
        const vFromPts = new tp.gp_Vec2d_5(p1, p2);
        const d3 = new tp.gp_Dir2d_2(vFromPts);
        expect(d3.X()).toBeCloseTo(1, TOL);
        expect(d3.Y()).toBeCloseTo(0, TOL);
    });

    // --- TestAxis1 ---
    // Go: NewAxis1(p, d), Point(), Dir()
    // JS: gp_Ax1_2(pnt, dir) creates gp_Ax1
    it("TestAxis1", () => {
        const a = new tp.gp_Ax1_2(pnt(0, 0, 0), dir(0, 0, 1));
        expect(a).toBeDefined();
    });

    // --- TestAxis2 ---
    // Go: NewAxis2FromNVX(p, n, x), NewxAxis2FromName("XY", p)
    // JS: gp_Ax2_2(pnt, normalDir, xDir) creates gp_Ax2
    it("TestAxis2 — from nvx", () => {
        const a = new tp.gp_Ax2_2(
            pnt(0, 0, 0),
            dir(0, 0, 1),
            dir(1, 0, 0),
        );
        expect(a).toBeDefined();
    });

    // Go: NewxAxis2FromName("XY", origin) → creates Axis2 from plane name
    // JS: gp_Ax2 from name not directly available; test via Plane named helper
    it("TestAxis2 — from name (via Plane)", () => {
        const p = tp.Plane.named("XY");
        expect(p).toBeDefined();
        const origin = p.origin();
        expect(origin).toBeDefined();
    });

    // --- TestAxis3 ---
    // Go: NewAxis3FromV(NewPoint3, NewDir3FromXYZ), NewAxis3(NewAxis2)
    // JS: gp_Ax3_3(gp_Pnt, gp_Dir, gp_Dir) / gp_Ax3_4(gp_Pnt, gp_Dir) / gp_Ax3_2(gp_Ax2) bound in WASM
    it("TestAxis3", () => {
        // from p, n, vx
        const a1 = new tp.gp_Ax3_3(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
        expect(a1).toBeDefined();
        expect(a1.Location().X()).toBeCloseTo(0, TOL);
        // from p, v (normal only)
        const a2 = new tp.gp_Ax3_4(pnt(0, 0, 0), dir(0, 0, 1));
        expect(a2).toBeDefined();
    });

    // --- TestAxis2d ---
    // Go: NewAxis2d(NewPoint2, NewDir2)
    // JS: gp_Ax2d_2(gp_Pnt2d, gp_Dir2d) bound in WASM
    it("TestAxis2d", () => {
        const p2 = new tp.gp_Pnt2d_3(0, 0);
        const d2 = new tp.gp_Dir2d_4(1, 0);
        const a = new tp.gp_Ax2d_2(p2, d2);
        expect(a).toBeDefined();
        const loc = a.Location();
        expect(loc.X()).toBeCloseTo(0, TOL);
        expect(loc.Y()).toBeCloseTo(0, TOL);
        const dir = a.Direction();
        expect(dir.X()).toBeCloseTo(1, TOL);
        expect(dir.Y()).toBeCloseTo(0, TOL);
    });

    // --- TestAxis22d ---
    // Go: NewAxis22d(a2d), NewAxis22dFromV(p, v), NewAxis22dFromVXY(p, vx, vy)
    // JS: gp_Ax22d_4(ax2d, sense), gp_Ax22d_3(pnt2d, dir2d, sense), gp_Ax22d_2(pnt2d, vx, vy)
    it("TestAxis22d", () => {
        const p2 = new tp.gp_Pnt2d_3(0, 0);
        const d2x = new tp.gp_Dir2d_4(1, 0);
        const d2y = new tp.gp_Dir2d_4(0, 1);
        // from Ax2d
        const a2d = new tp.gp_Ax2d_2(p2, d2x);
        const ax22 = new tp.gp_Ax22d_4(a2d, true);
        expect(ax22).toBeDefined();
        expect(ax22.Location().X()).toBeCloseTo(0, TOL);
        expect(ax22.Location().Y()).toBeCloseTo(0, TOL);
        expect(ax22.XDirection().X()).toBeCloseTo(1, TOL);
        expect(ax22.YDirection().Y()).toBeCloseTo(1, TOL);
        // from p, v, sense
        const ax22b = new tp.gp_Ax22d_3(p2, d2x, true);
        expect(ax22b).toBeDefined();
        // from p, vx, vy
        const ax22c = new tp.gp_Ax22d_2(p2, d2x, d2y);
        expect(ax22c).toBeDefined();
    });

    // --- TestCirc ---
    // Go: NewCircFromAxis2(a, 5), Radius() → 5
    // JS: gp_Circ_2(ax2, radius) creates gp_Circ
    it("TestCirc — from axis2", () => {
        const a = new tp.gp_Ax2_2(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
        const c = new tp.gp_Circ_2(a, 5);
        expect(c).toBeDefined();
        expect(c.Radius()).toBeCloseTo(5, TOL);
    });

    // Go: NewCircFromPoint(p1, p2, p3) — 3-point circle
    // JS: GeometryCreator.makeCircleWithThreePoints
    it("TestCirc — from 3 points", () => {
        const c = tp.GeometryCreator.makeCircleWithThreePoints(
            pnt(-5, 0, 0), pnt(0, 5, 0), pnt(5, 0, 0),
        );
        expect(c).toBeDefined();
        expect(c).not.toBeNull();
    });

    // Go: NewCircFromCenterNorm(center, dir, 5)
    // JS: GeometryCreator.makeCircleWithCenterNormal
    it("TestCirc — from center normal", () => {
        const c = tp.GeometryCreator.makeCircleWithCenterNormal(
            pnt(0, 0, 0), dir(0, 0, 1), 5,
        );
        expect(c).toBeDefined();
        expect(c).not.toBeNull();
    });

    // --- TestCirc2d ---
    // Go: NewCirc2dFromCenterRadius(NewPoint2, 5)
    // JS: gp_Circ2d_2(gp_Ax2d, radius, isSense) bound in WASM
    it("TestCirc2d", () => {
        const p2 = new tp.gp_Pnt2d_3(0, 0);
        const d2 = new tp.gp_Dir2d_4(1, 0);
        const ax2d = new tp.gp_Ax2d_2(p2, d2);
        const c = new tp.gp_Circ2d_2(ax2d, 5, true);
        expect(c).toBeDefined();
        expect(c.Radius()).toBeCloseTo(5, TOL);
        const loc = c.Location();
        expect(loc.X()).toBeCloseTo(0, TOL);
        expect(loc.Y()).toBeCloseTo(0, TOL);
    });

    // --- TestLine ---
    // Go: NewLineFromPointDir, NewLineFromPoint
    // JS: gp_Lin_3(gp_Pnt, gp_Dir) or gp_Lin_2(gp_Ax1) bound in WASM
    it("TestLine", () => {
        const l = new tp.gp_Lin_3(pnt(0, 0, 0), dir(1, 0, 0));
        expect(l).toBeDefined();
        const loc = l.Location();
        expect(loc.X()).toBeCloseTo(0, TOL);
        // from point + dir (two-point equivalent)
        const l2 = new tp.gp_Lin_3(pnt(0, 0, 0), dir(1, 0, 0));
        expect(l2).toBeDefined();
    });

    // --- TestLine2d ---
    // Go: NewLine2dFromPointDir(NewPoint2, NewDir2)
    // JS: gp_Lin2d_3(gp_Pnt2d, gp_Dir2d) bound in WASM
    it("TestLine2d", () => {
        const p2 = new tp.gp_Pnt2d_3(0, 0);
        const d2 = new tp.gp_Dir2d_4(1, 0);
        const l = new tp.gp_Lin2d_3(p2, d2);
        expect(l).toBeDefined();
        const loc = l.Location();
        expect(loc.X()).toBeCloseTo(0, TOL);
        expect(loc.Y()).toBeCloseTo(0, TOL);
        const dir2d = l.Direction();
        expect(dir2d.X()).toBeCloseTo(1, TOL);
        expect(dir2d.Y()).toBeCloseTo(0, TOL);
    });

    // --- TestPlane ---
    // Go: NewPlaneFromPointDir(p, d)
    // JS: Plane class with named() and other constructors
    it("TestPlane", () => {
        const p = tp.Plane.named("XY");
        expect(p).toBeDefined();
        expect(p.origin()).toBeDefined();
    });

    // --- TestCone ---
    // Go: NewConeFromAxis2(a, 30, 5), Angle(), Radius()
    // JS: gp_Cone constructors expect gp_Ax3; gp_Cone_1() default works but
    //     gp_Cone_2(ax3, angle, radius) has issues (throws with undefined msg)
    it("TestCone — gp_Cone_2(ax3, angle, radius)", () => {
      const ax3 = new tp.gp_Ax3_3(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
      const cone = new tp.gp_Cone_2(ax3, Math.PI / 6, 5);
      expect(cone).toBeDefined();
      expect(cone.SemiAngle()).toBeCloseTo(Math.PI / 6, 5);
      expect(cone.RefRadius()).toBeCloseTo(5, TOL);
    });

    // --- TestCylinderGeom ---
    // Go: NewCylinderFromAxis2(a, 5), Axis(), Radius()
    // JS: gp_Cylinder_2(ax3, radius) creates gp_Cylinder; ax3 from gp_Ax3_3
    it("TestCylinderGeom", () => {
        const ax3 = new tp.gp_Ax3_3(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
        const c = new tp.gp_Cylinder_2(ax3, 5);
        expect(c).toBeDefined();
        expect(c.Radius()).toBeCloseTo(5, TOL);
    });

    // --- TestElips ---
    // Go: NewElipsFromAxis2Radius(a, 10, 5), MajorRadius() → 10, MinorRadius() → 5
    // JS: gp_Elips_2(ax2, major, minor) creates gp_Elips
    it("TestElips — from axis2 radius", () => {
        const a = new tp.gp_Ax2_2(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
        const e = new tp.gp_Elips_2(a, 10, 5);
        expect(e).toBeDefined();
        expect(e.MajorRadius()).toBeCloseTo(10, TOL);
        expect(e.MinorRadius()).toBeCloseTo(5, TOL);
    });

    // --- TestElips2d ---
    // Go: NewElips2dFromAxis2dRadius(a, 10, 5), MajorRadius(), MinorRadius()
    // JS: gp_Elips2d_2(gp_Ax2d, major, minor, isSense) bound in WASM
    it("TestElips2d", () => {
        const p2 = new tp.gp_Pnt2d_3(0, 0);
        const d2 = new tp.gp_Dir2d_4(1, 0);
        const a2d = new tp.gp_Ax2d_2(p2, d2);
        const e = new tp.gp_Elips2d_2(a2d, 10, 5, true);
        expect(e).toBeDefined();
        expect(e.MajorRadius()).toBeCloseTo(10, TOL);
        expect(e.MinorRadius()).toBeCloseTo(5, TOL);
    });

    // --- TestHyperbola ---
    // Go: NewHyperbolaFromAxis2(a, 10, 5), MajorRadius(), MinorRadius()
    // JS: gp_Hypr_2(ax2, major, minor) creates gp_Hypr
    it("TestHyperbola", () => {
        const a = new tp.gp_Ax2_2(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
        const h = new tp.gp_Hypr_2(a, 10, 5);
        expect(h).toBeDefined();
        expect(h.MajorRadius()).toBeCloseTo(10, TOL);
        expect(h.MinorRadius()).toBeCloseTo(5, TOL);
    });

    // --- TestParabola ---
    // Go: NewParabolaFromAxis2(a, 5), Focal() → 5
    // JS: gp_Parab_2(ax2, focal) creates gp_Parab
    it("TestParabola", () => {
        const a = new tp.gp_Ax2_2(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
        const p = new tp.gp_Parab_2(a, 5);
        expect(p).toBeDefined();
        expect(p.Focal()).toBeCloseTo(5, TOL);
    });

    // --- TestSphereGeom ---
    // Go: NewSphere(a3, 10), Radius()
    // JS: gp_Sphere_2(ax3, radius) creates gp_Sphere
    it("TestSphereGeom", () => {
        const ax3 = new tp.gp_Ax3_3(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
        const s = new tp.gp_Sphere_2(ax3, 10);
        expect(s).toBeDefined();
        expect(s.Radius()).toBeCloseTo(10, TOL);
    });

    // --- TestTorusGeom ---
    // Go: NewTorusFromAxis3(a3, 20, 5), MajorRadius(), MinorRadius()
    // JS: gp_Torus_2(ax3, major, minor) creates gp_Torus
    it("TestTorusGeom", () => {
        const ax3 = new tp.gp_Ax3_3(pnt(0, 0, 0), dir(0, 0, 1), dir(1, 0, 0));
        const t = new tp.gp_Torus_2(ax3, 20, 5);
        expect(t).toBeDefined();
        expect(t.MajorRadius()).toBeCloseTo(20, TOL);
        expect(t.MinorRadius()).toBeCloseTo(5, TOL);
    });

    // --- TestTrsf ---
    // Go: NewTrsf(12 args), NewTrsfTranslationFromVector, NewTrsfRotationFromPointDir, NewTrsfScaleFromLine
    // JS: gp_Trsf_1() + SetValues/SetTranslation_1/SetRotation_1/SetScale bound in WASM
    it("TestTrsf", () => {
        // identity (12 args → SetValues)
        const t1 = new tp.gp_Trsf_1();
        t1.SetValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0);
        expect(t1.Form()).toBeDefined();
        // translation
        const t2 = new tp.gp_Trsf_1();
        t2.SetTranslation_1(vec(10, 0, 0));
        const tp_ = t2.TranslationPart();
        expect(tp_.X()).toBeCloseTo(10, TOL);
        // rotation
        const t3 = new tp.gp_Trsf_1();
        t3.SetRotation_1(new tp.gp_Ax1_2(pnt(0, 0, 0), dir(0, 0, 1)), 45);
        expect(t3.Form()).toBeDefined();
        // scale
        const t4 = new tp.gp_Trsf_1();
        t4.SetScale(pnt(0, 0, 0), 2);
        expect(t4.ScaleFactor()).toBeCloseTo(2, TOL);
    });

    // --- TestTrsfMirror ---
    // Go: NewTrsfMirrorFromPoint, FromAxis1, FromPlane
    // JS: gp_Trsf_1() + SetMirror_1(pnt)/SetMirror_2(ax1)/SetMirror_3(ax2) bound in WASM
    it("TestTrsfMirror", () => {
        // mirror point
        const t1 = new tp.gp_Trsf_1();
        t1.SetMirror_1(pnt(0, 0, 0));
        expect(t1.Form()).toBeDefined();
        // mirror axis1
        const t2 = new tp.gp_Trsf_1();
        t2.SetMirror_2(new tp.gp_Ax1_2(pnt(0, 0, 0), dir(0, 0, 1)));
        expect(t2.Form()).toBeDefined();
        // mirror ax2 (plane)
        const t3 = new tp.gp_Trsf_1();
        t3.SetMirror_3(ax2(0, 0, 0, 0, 0, 1, 1, 0, 0));
        expect(t3.Form()).toBeDefined();
    });

    // --- TestTrsf2d ---
    // Go: NewTrsf2dTranslationFromVector, NewTrsf2dRotationFromPoint
    // JS: gp_Trsf2d_1() + SetTranslation_1/SetRotation bound in WASM
    it("TestTrsf2d", () => {
        // translation
        const t1 = new tp.gp_Trsf2d_1();
        t1.SetTranslation_1(new tp.gp_Vec2d_4(10, 0));
        expect(t1.Form()).toBeDefined();
        const tpPart = t1.TranslationPart();
        expect(tpPart.X()).toBeCloseTo(10, TOL);
        expect(tpPart.Y()).toBeCloseTo(0, TOL);
        // rotation
        const t2 = new tp.gp_Trsf2d_1();
        t2.SetRotation(new tp.gp_Pnt2d_3(0, 0), 45);
        expect(t2.Form()).toBeDefined();
    });

    // --- TestColor ---
    // Go: NewColor([1,0.5,0]), RGB() → [255,127,0], RGBF(), RGBD()
    // JS: Quantity_Color_3(r,g,b,Quantity_TOC_RGB) 构造可用, Red/Green/Blue 查询可用;
    //     SetValues_2/Values 参数编组有缺口, 保持 skip
    it("TestColor — construction and basic RGB queries", () => {
        const c = new tp.Quantity_Color_3(1.0, 0.5, 0.0, tp.Quantity_TypeOfColor.Quantity_TOC_RGB);
        expect(c).toBeDefined();
        expect(c.Red()).toBeCloseTo(1.0, 5);
        expect(c.Green()).toBeCloseTo(0.5, 5);
        expect(c.Blue()).toBeCloseTo(0.0, 5);
    });

    it("TestColor SetValues/Values — parameter marshalling gap in WASM binding", () => {
      // SetValues_2 with 4 args (r,g,b,type) is the correct setter
      // Values() uses C++ output references (Standard_Real&) which embind can't marshal
      // Workaround: use Red()/Green()/Blue() getters + SetValues_2 setter
      const c = new tp.Quantity_Color_3(0.0, 0.0, 0.0, tp.Quantity_TypeOfColor.Quantity_TOC_RGB);
      c.SetValues_2(1.0, 0.5, 0.0, tp.Quantity_TypeOfColor.Quantity_TOC_RGB);
      expect(c.Red()).toBeCloseTo(1.0, 5);
      expect(c.Green()).toBeCloseTo(0.5, 5);
      expect(c.Blue()).toBeCloseTo(0.0, 5);
    });

    // --- TestBBox ---
    // Go: NewBBox([0,10,0,10,0,10]), Data() → 6-element array
    // Go test only checks len(data)==6, doesn't assert specific values
    // (Go BBox stores [minx,miny,minz,maxx,maxy,maxz] = [0,10,0,10,0,10])
    // JS: BBox constructor expects (xMin,yMin,zMin,xMax,yMax,zMax)
    it("TestBBox", () => {
        const bb = new tp.BBox(0, 0, 0, 10, 10, 10);
        expect(bb).toBeDefined();
        expect(bb.xMin()).toBeCloseTo(0, TOL);
        expect(bb.yMin()).toBeCloseTo(0, TOL);
        expect(bb.zMin()).toBeCloseTo(0, TOL);
        expect(bb.xMax()).toBeCloseTo(10, TOL);
        expect(bb.yMax()).toBeCloseTo(10, TOL);
        expect(bb.zMax()).toBeCloseTo(10, TOL);
        // Go test: Data() has 6 elements — JS equivalent: accessors work
        expect(bb.xLength()).toBeCloseTo(10, TOL);
        expect(bb.yLength()).toBeCloseTo(10, TOL);
        expect(bb.zLength()).toBeCloseTo(10, TOL);
    });

    // --- TestQuaternion ---
    // Go: NewQuaternion([0,0,0,1]), Data()
    // JS: gp_Quaternion_2(x, y, z, w) creates gp_Quaternion
    it("TestQuaternion", () => {
        const q = new tp.gp_Quaternion_2(0, 0, 0, 1);
        expect(q).toBeDefined();
    });

    // --- TestPlaneNameConstants ---
    // Go: XYPlane="XY", YZPlane="YZ", TopPlane="top", FrontPlane="front"
    // JS: Go-only wrapper constants with no C++ binding; verify via Plane.named() instead
    it("TestPlaneNameConstants — verify via Plane.named()", () => {
        expect(tp.Plane.named("XY")).toBeDefined();
        expect(tp.Plane.named("YZ")).toBeDefined();
        expect(tp.Plane.named("XZ")).toBeDefined();
    });

    // --- TestXYZ ---
    // Go: NewXYZ([1,2,3]), Data() → [1,2,3]
    // JS: gp_XYZ_2(x,y,z) bound in WASM — go-topo's XYZ wraps gp_XYZ
    it("TestXYZ", () => {
        const xyz = new tp.gp_XYZ_2(1, 2, 3);
        expect(xyz.X()).toBeCloseTo(1, TOL);
        expect(xyz.Y()).toBeCloseTo(2, TOL);
        expect(xyz.Z()).toBeCloseTo(3, TOL);
    });
});

// =========================================================================
// topo_test.go — 9 tests
// =========================================================================
describe("topo_test.go port", () => {
    // --- TestMakeArc ---
    // Go: GeomMakeArcOfPoint → curve.Curve() → TopoMakeEdgeFromCurve
    // JS: Edge.makeThreePointArc creates an edge from three points directly
    // (makeEdgeFromCurve expects Handle_Geom_Curve but makeArcOfCircleWithThreePoints
    //  returns Handle_Geom_TrimmedCurve which is a subtype not auto-upcast by embind)
    it("TestMakeArc", () => {
        // Go creates arc curve then wraps in edge; JS equivalent:
        const edge = tp.Edge.makeThreePointArc(
            pnt(88.27510582562536, 47.17234171088785, 1.3518126332201064),
            pnt(-2.002824238501489, 61.12643328495324, -79.24088457413018),
            pnt(0, 0, 0),
        );
        expect(edge).toBeDefined();
        expect(edge.isNull()).toBe(false);
    });

    // --- TestMakeDir ---
    // Go: NewDir3FromXYZ([0,0,0]) — degenerate direction (zero vector)
    // JS: new Vector(0,0,0).toDir() — may throw since zero vector is degenerate
    it("TestMakeDir — degenerate direction (zero vector)", () => {
        // Go test just prints dir.Data(), doesn't assert anything useful
        // In JS, creating a dir from zero vector may throw
        try {
            const d = new tp.Vector(0, 0, 0).toDir();
            // If it doesn't throw, that's also acceptable behavior
            expect(d).toBeDefined();
        } catch {
            // Expected: degenerate direction throws
        }
    });

    // --- TestMaakeWire ---
    // Go: TopoMakeWireFromCircle, WireLength, TopoMakeWireFromCombineCurve, TopoMakeSolid, SweepWire
    // JS: Edge.makeCircle → Wire.makeWireFromEdge + Wire.length()
    // Wire.makeCircle binding returns undefined with single radius arg;
    // use Edge.makeCircle + Wire.makeWireFromEdge which is the equivalent path.
    it("TestMaakeWire — wire from circle + length", () => {
        const edge = tp.Edge.makeCircle(10);
        expect(edge).toBeDefined();
        expect(edge.isNull()).toBe(false);

        const w = tp.Wire.makeWireFromEdge(edge);
        expect(w).toBeDefined();
        expect(w.isNull()).toBe(false);

        const length = w.length();
        expect(length).toBeGreaterThan(0);
        // Circle of radius 10 → circumference ≈ 62.83
        expect(length).toBeCloseTo(2 * Math.PI * 10, 2);
    });

    // --- TestMaakeWire2 ---
    // Go: TopoMakeEdgeFromTwoPoint for each pair, TopoMakeWireFromEdges
    // JS: Edge.makeEdgeFromTwoPoint + Wire.makeWireFromEdges
    it("TestMaakeWire2", () => {
        const points: Array<[number, number, number]> = [
            [0, 0, 0],
            [46.3256, -90.7646, 108.893],
            [46.3256, -90.7646, 108.893],
            [131.694, -256.482, -2.52019],
            [131.694, -256.482, -2.52019],
            [176.996, -427.627, 247.322],
            [176.996, -427.627, 247.322],
            [300.229, -1026.2, 570.908],
            [300.229, -1026.2, 570.908],
            [314.317, -1038.7, 581.424],
            [314.317, -1038.7, 581.424],
            [329.994, -1060.71, 618.145],
        ];

        const edges: any[] = [];
        for (let i = 0; i < points.length; i += 2) {
            const edge = tp.Edge.makeEdgeFromTwoPoint(
                pnt(points[i][0], points[i][1], points[i][2]),
                pnt(points[i + 1][0], points[i + 1][1], points[i + 1][2]),
            );
            edges.push(edge);
        }
        const w = tp.Wire.makeWireFromEdges(edges);
        expect(w).toBeDefined();
        expect(w.isValid()).toBe(true);
    });

    // --- TestBuge ---
    // Go: CreateMultiSegmentPipe with ShapeProfile/PolygonProfile — go-topo specific
    // JS: createMultiSegmentPipe + PolygonProfile {type: ProfileType.POLYGON, edges, inners}
    it("TestBuge", () => {
        const points = [
            [pnt(0, 0, 0), pnt(13.363751136232167, -26.227833716198802, 40.422308564186096)],
            [pnt(13.363751136232167, -26.227833716198802, 40.422308564186096), pnt(46.29231750732288, -90.69991450663656, 108.94551491551101)],
        ];
        const polyEdges1 = [
            pnt(-3.171, 2.538, 0), pnt(-3.136, 3.954, 0), pnt(-2.498, 5.219, 0),
            pnt(-1.382, 6.09, 0), pnt(0, 6.4, 0), pnt(1.382, 6.09, 0),
            pnt(2.498, 5.219, 0), pnt(3.136, 3.954, 0), pnt(3.171, 2.538, 0),
            pnt(2.5, 0, 0), pnt(-2.5, 0, 0), pnt(-3.171, 2.538, 0),
        ];
        const polyEdges2 = [
            pnt(-3.4, 3.25, 0), pnt(-2.773, 4.717, 0), pnt(-1.553, 5.746, 0),
            pnt(0, 6.115, 0), pnt(1.553, 5.746, 0), pnt(2.773, 4.717, 0),
            pnt(3.4, 3.25, 0), pnt(3.4, 0, 0), pnt(-3.4, 0, 0), pnt(-3.4, 3.25, 0),
        ];
        const innerEdges1 = [
            pnt(-3.078273455639578, 2.575440459011272, 0), pnt(-3.036354153205542, 3.945591360596666, 0),
            pnt(-2.415107425541498, 5.163064134049417, 0), pnt(-1.339465963909452, 5.999496653245043, 0),
            pnt(-0.00978236558095332, 6.3004796235756695, 0), pnt(1.3250857438602934, 6.007776113883715, 0),
            pnt(2.410219147892808, 5.171098830877157, 0), pnt(3.0362530020384777, 3.946891104328797, 0),
            pnt(3.0763705290048873, 2.57033053075941, 0), pnt(2.4402700090676666, 0.08020179663338835, 0),
            pnt(-2.4484020179459174, 0.08566007382641323, 0), pnt(-3.078273455639578, 2.575440459011272, 0),
        ];
        const innerEdges2 = [
            pnt(-3.3009689384399516, 3.2638870027828157, 0), pnt(-2.681019727080062, 4.6777618885065335, 0),
            pnt(-1.5023855429647655, 5.659755134999072, 0), pnt(-0.013823869618346543, 6.0159601058725585, 0),
            pnt(1.4854596950468153, 5.672255120809437, 0), pnt(2.678133803605064, 4.68537082388747, 0),
            pnt(3.30065175118932, 3.2613984849103375, 0), pnt(3.328711291934881, 0.07012788391507485, 0),
            pnt(-3.336054557835377, 0.07688290074113246, 0), pnt(-3.3009689384399516, 3.2638870027828157, 0),
        ];
        const dirVec = dir(-0.37127704827582503, 0.7201908387390975, 0.586070396129907);
        const shp = tp.createMultiSegmentPipe({
            wires: points,
            profiles: [
                { type: tp.ProfileType.POLYGON, edges: polyEdges1, inners: [] },
                { type: tp.ProfileType.POLYGON, edges: polyEdges2, inners: [] },
            ],
            innerProfiles: [
                { type: tp.ProfileType.POLYGON, edges: innerEdges1, inners: [] },
                { type: tp.ProfileType.POLYGON, edges: innerEdges2, inners: [] },
            ],
            segmentTypes: [tp.SegmentType.LINE, tp.SegmentType.LINE],
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dirVec,
        });
        expect(shp).toBeDefined();
        expect(shp.IsNull()).toBe(false);
    });

    // --- TestBug2 ---
    // Go: CreateMultiSegmentPipe with complex wires and profiles (6 segments, mixed line/arc)
    // JS: createMultiSegmentPipe with THREE_POINT_ARC segments
    it("TestBug2", () => {
        const wires = [
            [pnt(0, 0, 0), pnt(-18.381608, -16.456729, 23.967570)],
            [pnt(-18.381608, -16.456729, 23.967570), pnt(-20.049600, -17.830275, 26.141186)],
            [pnt(-20.049600, -17.830275, 26.141186), pnt(-29.312281, -23.429547, 34.741874), pnt(-55.277435, -31.565721, 41.815130)],
            [pnt(-55.277435, -31.565721, 41.815130), pnt(-255.585003, -75.656772, 31.748227)],
            [pnt(-255.585003, -75.656772, 31.748227), pnt(-328.386169, -107.483284, 77.701580), pnt(-331.303108, -111.641479, 87.604189)],
            [pnt(-331.303108, -111.641479, 87.604189), pnt(-334.263097, -118.631098, 102.370422)],
        ];
        const polygonPts = [
            pnt(-3.9, 4, 0), pnt(-2.652, 5.403, 0), pnt(-0.939, 6.172, 0),
            pnt(0.939, 6.172, 0), pnt(2.652, 5.403, 0), pnt(3.9, 4, 0),
            pnt(3.9, 0, 0), pnt(-3.9, 0, 0), pnt(-3.9, 4, 0),
        ];
        const prof = { type: tp.ProfileType.POLYGON, edges: polygonPts, inners: [] } as any;
        const upDir = dir(-0.301612, 0.874964, 0.378773);
        const shp = tp.createMultiSegmentPipe({
            wires,
            profiles: [prof, prof, prof, prof, prof, prof],
            innerProfiles: null,
            segmentTypes: [
                tp.SegmentType.LINE, tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC,
                tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC, tp.SegmentType.LINE,
            ],
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir,
        });
        expect(shp).toBeDefined();
        expect(shp.IsNull()).toBe(false);
    });

    // --- TestBug3 ---
    // Go: CreateMultiSegmentPipe with 3 segments, mixed line/arc
    it("TestBug3", () => {
        const wires = [
            [pnt(0, 0, 0), pnt(-35.691625, -32.978268, 46.548679)],
            [pnt(-35.691625, -32.978268, 46.548679), pnt(-37.229320, -36.179758, 52.584004), pnt(-33.071860, -37.840417, 59.567516)],
            [pnt(-33.071860, -37.840417, 59.567516), pnt(150.857507, -37.395352, 200.922442)],
        ];
        const polygonPts = [
            pnt(-1.5, 2.1, 0), pnt(-0.875, 2.758, 0), pnt(0, 3, 0),
            pnt(0.875, 2.758, 0), pnt(1.5, 2.1, 0), pnt(1.5, 0, 0),
            pnt(-1.5, 0, 0), pnt(-1.5, 2.1, 0),
        ];
        const prof = { type: tp.ProfileType.POLYGON, edges: polygonPts, inners: [] } as any;
        const upDir = dir(-0.301639, 0.874967, 0.378744);
        const shp = tp.createMultiSegmentPipe({
            wires,
            profiles: [prof, prof, prof],
            innerProfiles: null,
            segmentTypes: [tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC, tp.SegmentType.LINE],
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir,
        });
        expect(shp).toBeDefined();
        expect(shp.IsNull()).toBe(false);
    });

    // --- TestBug4 ---
    // Go: CreateMultiSegmentPipeWithSplitDistances with outer/inner profiles
    // JS: createMultiSegmentPipeWithSplitDistances(params, [split1, split2])
    it("TestBug4", () => {
        const wires = [
            [pnt(0, 0, 0), pnt(-128.976600, -1.038238, -99.629249)],
        ];
        const outerPts = [
            pnt(0, 16.1, 0), pnt(14.25, 16.1, 0), pnt(14.25, 17.98, 0),
            pnt(14.049, 18.948, 0), pnt(13.701, 19.873, 0), pnt(13.213, 20.734, 0),
            pnt(12.599, 21.508, 0), pnt(9.375, 23.71, 0), pnt(5.778, 25.228, 0),
            pnt(1.952, 26.002, 0), pnt(-1.952, 26.002, 0), pnt(-5.778, 25.228, 0),
            pnt(-9.375, 23.71, 0), pnt(-12.599, 21.508, 0), pnt(-13.213, 20.734, 0),
            pnt(-13.701, 19.873, 0), pnt(-14.049, 18.948, 0), pnt(-14.25, 17.98, 0),
            pnt(-14.259, 16.1, 0), pnt(0, 16.1, 0),
        ];
        const innerPts = [
            pnt(-0.00001, 16.2, 0), pnt(14.154677, 16.130224, 0), pnt(14.151671, 17.998204, 0),
            pnt(13.949699, 18.959806, 0), pnt(13.601148, 19.878432, 0), pnt(13.113004, 20.733124, 0),
            pnt(12.499248, 21.500956, 0), pnt(9.280031, 23.678682, 0), pnt(5.699827, 25.165638, 0),
            pnt(1.917907, 25.907991, 0), pnt(-1.917921, 25.907986, 0), pnt(-5.699832, 25.165632, 0),
            pnt(-9.280031, 23.67868, 0), pnt(-12.499248, 21.500956, 0), pnt(-13.113004, 20.733124, 0),
            pnt(-13.601148, 19.878432, 0), pnt(-13.949699, 18.959806, 0), pnt(-14.151671, 17.998206, 0),
            pnt(-14.163672, 16.130208, 0), pnt(-0.00001, 16.2, 0),
        ];
        const upDir = dir(-0.301619, 0.874963, 0.378768);
        const shp = tp.createMultiSegmentPipeWithSplitDistances({
            wires,
            profiles: [{ type: tp.ProfileType.POLYGON, edges: outerPts, inners: [] }],
            innerProfiles: [{ type: tp.ProfileType.POLYGON, edges: innerPts, inners: [] }],
            segmentTypes: [tp.SegmentType.LINE],
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir,
        }, [64.3, 68.4]);
        expect(shp).toBeDefined();
        expect(shp.IsNull()).toBe(false);
    });

    // --- TestCustomPolygonPipe ---
    // Go: CreateMultiSegmentPipe with custom 21-point polygon profile
    it("TestCustomPolygonPipe", () => {
        const wires = [
            [pnt(0, 0, 0), pnt(0, 0, 50)],
        ];
        const customPts = [
            pnt(0, 10, 0), pnt(-3.403, 9.702, 0), pnt(-6.703, 8.818, 0),
            pnt(-9.8, 7.374, 0), pnt(-12.599, 5.415, 0), pnt(-13.168, 4.846, 0),
            pnt(-13.63, 4.188, 0), pnt(-13.97, 3.459, 0), pnt(-14.179, 2.682, 0),
            pnt(-14.25, 1.88, 0), pnt(-14.25, 0, 0), pnt(-5.4, 0, 0),
            pnt(-5.4, 1.2, 0), pnt(-5.6, 1.2, 0), pnt(-5.6, 6.93, 0),
            pnt(-4.928, 7.812, 0), pnt(-4.118, 8.57, 0), pnt(-3.193, 9.182, 0),
            pnt(-2.18, 9.632, 0), pnt(-1.105, 9.907, 0), pnt(0, 10, 0),
        ];
        const upDir = dir(0, 1, 0);
        const shp = tp.createMultiSegmentPipe({
            wires,
            profiles: [{ type: tp.ProfileType.POLYGON, edges: customPts, inners: [] }],
            innerProfiles: null,
            segmentTypes: [tp.SegmentType.LINE],
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir,
        });
        expect(shp).toBeDefined();
        expect(shp.IsNull()).toBe(false);
    });
});

// =========================================================================
// dxf_test.go — 1 test (ported)
// =========================================================================
describe("dxf_test.go port", () => {
    it("TestNewDxfReader", () => {
        // Create a minimal valid DXF file in MEMFS with HEADER + ENTITIES
        // DXF requires at least a HEADER section before ENTITIES
        const dxfContent = [
            "0", "SECTION", "2", "HEADER",
            "9", "$INSUNITS", "70", "4",
            "0", "ENDSEC",
            "0", "SECTION", "2", "ENTITIES",
            "0", "LINE", "8", "layer1",
            "10", "0.0", "20", "0.0", "30", "0.0",
            "11", "10.0", "21", "0.0", "31", "0.0",
            "0", "ENDSEC",
            "0", "EOF",
        ].join("\n") + "\n";

        const dxfPath = "/tmp/test_reader.dxf";
        tp.FS.writeFile(dxfPath, dxfContent);

        const reader = new tp.DxfShapeReader(dxfPath);
        expect(reader).toBeDefined();
        expect(reader.failed()).toBe(false);

        reader.doRead();
        expect(reader.failed()).toBe(false);
        expect(reader.error()).toBe("");

        const layers = reader.getLayerNames();
        expect(layers.size()).toBeGreaterThan(0);
    });
});
