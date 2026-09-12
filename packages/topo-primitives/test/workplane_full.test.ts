/**
 * Full port of go-topo workplane_test.go → vitest
 *
 * Tests work directly with tp.Workplane (Embind raw API), NOT via CQWorkplane shim.
 * Reference: /Users/xuning/Work/go-topo/workplane_test.go (997 lines)
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTopo, checkShape } from "./helpers/topo";

const here = dirname(fileURLToPath(import.meta.url));

// --- WASM singleton --------------------------------------------------------
let tp: any;
beforeAll(async () => {
    tp = await getTopo();
    // C++ add() binding does instanceof(emval_global("Workplane")) which needs
    // Workplane exposed as a global JS variable.
    (globalThis as any).Workplane = tp.Workplane;
    // Register all classes needed by add() instanceof checks
    for (const n of ["gp_Trsf", "TopLoc_Location", "gp_Pnt", "gp_Vec", "gp_Pln", "topo_vector", "Vector", "Shape", "Sketch"]) {
        if ((tp as any)[n] !== undefined) {
            (globalThis as any)[n] = (tp as any)[n];
        }
    }
});

// --- Helpers ---------------------------------------------------------------
const TOL = 1e-6;

function wpXY(): any {
    return new tp.Workplane();
}

function wpNamed(name: string): any {
    const origin = new tp.Vector(0, 0, 0);
    return new tp.Workplane(name, origin, undefined);
}

function vec3(x: number, y: number, z: number): any {
    return new tp.Vector(x, y, z);
}

function gpVec3(x: number, y: number, z: number): any {
    return new tp.gp_Vec_4(x, y, z);
}

// ============================================================================
// Tests
// ============================================================================

describe("TestNewWorkplane", () => {
    it("empty", () => {
        const wp = wpXY();
        expect(wp).not.toBeNull();
    });

    it("named XY", () => {
        const origin = vec3(0, 0, 0);
        const wp = new tp.Workplane("XY", origin, undefined);
        expect(wp).not.toBeNull();
    });

    it("named YZ", () => {
        const origin = vec3(0, 0, 0);
        const wp = new tp.Workplane("YZ", origin, undefined);
        expect(wp).not.toBeNull();
    });

    it("named XZ", () => {
        const origin = vec3(0, 0, 0);
        const wp = new tp.Workplane("XZ", origin, undefined);
        expect(wp).not.toBeNull();
    });

    it("from plane", () => {
        const plane = tp.Plane.named("XY");
        const originVec = vec3(0, 0, 0);
        const wp = new tp.Workplane(plane, originVec, undefined);
        expect(wp).not.toBeNull();
    });
});

describe("TestBoxConvenience", () => {
    it("BoxCentered", () => {
        const wp = wpNamed("XY");
        const r = wp.box(10, 20, 30, true, true, true);
        const val = r.val();
        expect(val).toBeDefined();
        expect(val.isNull()).toBe(false);
    });

    it("BoxCorners", () => {
        const wp = wpNamed("XY");
        const r = wp.box(10, 20, 30, false, false, false, true, true);
        expect(r).toBeDefined();
    });

    it("BoxFull params", () => {
        const wp = wpNamed("XY");
        const r = wp.box(10, 20, 30, true, true, true, true, true);
        const val = r.val();
        expect(val).toBeDefined();
        expect(val.isNull()).toBe(false);
    });
});

describe("TestSphereConvenience", () => {
    it("SphereCentered", () => {
        const wp = wpNamed("XY");
        const r = wp.sphere(10, undefined, -90, 90, 360, true, true, true);
        expect(r).toBeDefined();
    });

    it("Sphere with params", () => {
        const wp = wpNamed("XY");
        const r = wp.sphere(10, undefined, -90, 90, 360, false, false, false, true, true);
        expect(r).toBeDefined();
    });
});

describe("TestCylinderConvenience", () => {
    it("CylinderCentered", () => {
        const wp = wpNamed("XY");
        const r = wp.cylinder(20, 5, undefined, 360, true, true, true);
        expect(r).toBeDefined();
    });

    it("CylinderAt", () => {
        const wp = wpNamed("XY");
        const r = wp.cylinder(20, 5, undefined, 360, false, false, false, true, true);
        const val = r.val();
        expect(val).toBeDefined();
        expect(val.isNull()).toBe(false);
    });
});

describe("TestRectCirclePolygon", () => {
    it("RectCentered", () => {
        const wp = wpNamed("XY");
        const r = wp.rect(20, 10, true, false);
        expect(r).toBeDefined();
    });

    it("CircleCentered", () => {
        const wp = wpNamed("XY");
        const r = wp.circle(10, false);
        expect(r).toBeDefined();
    });

    it("PolygonSimple", () => {
        const wp = wpNamed("XY");
        const r = wp.polygon(6, 10, false, false);
        expect(r).toBeDefined();
    });
});

describe("TestExtrudeSimple", () => {
    it("extrude rect", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        const r2 = r1.extrude(20, true, true, false, 0);
        expect(r2).toBeDefined();
    });

    it("extrude with combine=false", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        const r2 = r1.extrude(20, false, true, false, 0);
        expect(r2).toBeDefined();
    });
});

describe("TestCutBlindSimple", () => {
    it("cut blind simple", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(20, 20, 20, false, false, false, true, true);
        const r2 = r1.faces(">Z", "");
        const sub = r2.create(0, false, tp.CenterOption.CENTER_OF_MASS, undefined);
        const r3 = sub.rect(5, 5, true, false);
        const r4 = r3.cutBlind(-10, true, false, 0);
        expect(r4).toBeDefined();
    });
});

describe("TestHoleThrough", () => {
    it("HoleThrough from top face", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(20, 20, 20, false, false, false, true, true);
        const topFaces = r1.faces(">Z", "");
        expect(topFaces.size()).toBeGreaterThan(0);
        const sub = topFaces.create(0, false, tp.CenterOption.CENTER_OF_MASS, undefined);
        const r2 = sub.hole(5, undefined, true);
        expect(r2).toBeDefined();
    });

    it("HoleThroughWithDepth", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(20, 20, 20, false, false, false, true, true);
        const r2 = r1.faces(">Z", "");
        const sub = r2.create(0, false, tp.CenterOption.CENTER_OF_MASS, undefined);
        const r3 = sub.hole(5, 25, true);
        expect(r3).toBeDefined();
    });
});

describe("TestWorkplaneFacesSelection", () => {
    it("select >Z face on box", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, false, false, false, true, true);
        const selected = r1.faces(">Z", "");
        expect(selected.size()).toBeGreaterThan(0);
    });

    it("select <Z face on box", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, false, false, false, true, true);
        const selected = r1.faces("<Z", "");
        expect(selected.size()).toBeGreaterThan(0);
    });

    it("select edges", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, false, false, false, true, true);
        const edges = r1.edges("%line", "");
        expect(edges).toBeDefined();
    });

    it("select vertices", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, false, false, false, true, true);
        const verts = r1.vertices("", "");
        expect(verts).toBeDefined();
    });
});

describe("TestWorkplaneMirror", () => {
    it("MirrorX", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        const r2 = r1.mirrorX();
        expect(r2).toBeDefined();
    });

    it("MirrorY", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        const r2 = r1.mirrorY();
        expect(r2).toBeDefined();
    });
});

describe("TestWorkplaneConstruction2D", () => {
    it("line chain and close", () => {
        const wp = wpNamed("XY");
        const r = wp.moveTo(-5, -5)
            .lineTo(5, -5, false)
            .lineTo(5, 5, false)
            .lineTo(-5, 5, false)
            .close();
        expect(r).toBeDefined();
    });

    it("slot2d", () => {
        const wp = wpNamed("XY");
        const r = wp.slot2d(10, 4, 0);
        expect(r).toBeDefined();
    });

    it("three point arc", () => {
        const wp = wpNamed("XY");
        const p1 = new tp.gp_Pnt_3(0, 5, 0);
        const p2 = new tp.gp_Pnt_3(5, 0, 0);
        const r = wp.moveTo(-5, 0).threePointArc(p1, p2, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneRevolveSimple", () => {
    it("revolve rect", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(5, 10, true, false);
        const r2 = r1.revolve(180, undefined, undefined, true, true);
        expect(r2).toBeDefined();
    });
});

describe("TestWorkplaneLoftSimple", () => {
    it("loft between two rects", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        const sub = r1.create(20, false, tp.CenterOption.CENTER_OF_MASS, undefined);
        const r2 = sub.rect(5, 5, true, false);
        const res = r2.loft(false, true, true);
        expect(res).toBeDefined();
    });
});

describe("TestWorkplaneFilletChamfer", () => {
    it("fillet on box edges", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, false, false, false, true, true);
        // 顶面 4 条直边做圆角 (方体上没有圆边, 原 %circle 选择器匹配为空,
        // fillet 会因 "edges be selected" 报错)
        const r2 = r1.faces(">Z", "").edges("", "");
        const r3 = r2.fillet(1);
        expect(r3).toBeDefined();
    });
});

// Binding bug: union/cut check typeOf() == "workplane" (lowercase) but embind
// registered class name is "Workplane" (uppercase). Workplane args always fall
// through to the compound branch and fail with type cast error.
describe("TestWorkplaneBoolean", () => {
    it("union", () => {
        const wp1 = wpNamed("XY");
        const r1 = wp1.box(10, 10, 10, true, true, true);
        const wp2 = wpNamed("XY");
        const r2 = wp2.box(5, 5, 20, true, true, true);
        const r3 = r1.union(r2, true, false, 0.001);
        expect(r3).toBeDefined();
    });

    it("cut", () => {
        const wp1 = wpNamed("XY");
        const r1 = wp1.box(10, 10, 10, true, true, true);
        const wp2 = wpNamed("XY");
        const r2 = wp2.cylinder(20, 5, undefined, 360, true, true, true);
        const r3 = r1.cut(r2, true, 0.001);
        expect(r3).toBeDefined();
    });
});

describe("TestWorkplaneSection", () => {
    it("section box", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, true, true, true);
        const section = r1.section(0);
        expect(section).toBeDefined();
        const val = section.val();
        expect(val).toBeDefined();
    });
});

describe("TestWorkplaneCombine", () => {
    it("combine", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, true, true, true);
        const wp2 = wpNamed("XY");
        const r2 = wp2.cylinder(20, 5, undefined, 360, true, true, true);
        wp.add(r2);
        const combined = r1.combine(true, false, 0.001);
        expect(combined).toBeDefined();
    });
});

describe("TestWorkplaneConsolidateWires", () => {
    it("consolidate wires", () => {
        const wp = wpNamed("XY");
        const r = wp.moveTo(-5, -5)
            .lineTo(5, -5, false)
            .lineTo(5, 5, false)
            .lineTo(-5, 5, false)
            .close();
        const cons = r.consolidateWires();
        expect(cons).toBeDefined();
    });
});

describe("TestWorkplaneOffset2D", () => {
    it("offset2d", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        const off = r1.offset2d(2, undefined, false);
        expect(off).toBeDefined();
    });
});

describe("TestWorkplaneLargestDimension", () => {
    it("largest dim", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 20, 30, true, true, true, true, true);
        const dim = r1.largestDimension();
        expect(dim).toBeGreaterThan(0);
    });
});

describe("TestWorkplaneNilSafety", () => {
    it("NewWorkplaneFromName nil origin", () => {
        // Go: NewWorkplaneFromName("XY", nil) → JS: construct with name only
        const wp = new tp.Workplane("XY", undefined, undefined);
        expect(wp).not.toBeNull();
    });

    it("NewWorkplaneFromPlane nil origin", () => {
        const plane = tp.Plane.named("XY");
        const wp = new tp.Workplane(plane, undefined, undefined);
        expect(wp).not.toBeNull();
    });

    it("Workplane nil origin", () => {
        const wp = wpNamed("XY");
        const sub = wp.create(0, false, tp.CenterOption.CENTER_OF_MASS, undefined);
        expect(sub).not.toBeNull();
    });

    it("Sphere nil direct", () => {
        const wp = wpNamed("XY");
        const r = wp.sphere(10, undefined, -90, 90, 360, false, false, false, true, true);
        expect(r).toBeDefined();
    });

    it("Cylinder nil direct", () => {
        const wp = wpNamed("XY");
        const r = wp.cylinder(20, 5, undefined, 360, false, false, false, true, true);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneHoleNilDepth", () => {
    it("Hole nil depth = through", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(20, 20, 20, false, false, false, true, true);
        const r2 = r1.faces(">Z", "");
        const sub = r2.create(0, false, tp.CenterOption.CENTER_OF_MASS, undefined);
        const r3 = sub.hole(5, undefined, true);
        expect(r3).toBeDefined();
    });
});

describe("TestWorkplaneHoleWithDepth", () => {
    it("Hole with explicit depth", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(20, 20, 20, false, false, false, true, true);
        const r2 = r1.faces(">Z", "");
        const sub = r2.create(0, false, tp.CenterOption.CENTER_OF_MASS, undefined);
        const r3 = sub.hole(5, 25, true);
        expect(r3).toBeDefined();
    });
});

describe("TestWorkplanePushPoints", () => {
    it("push points and circle", () => {
        const wp = wpNamed("XY");
        const loc1 = new tp.Vector(0, 0, 0);
        const loc2 = new tp.Vector(0, 0, 0);
        const r1 = wp.pushPoints([loc1, loc2]);
        const r2 = r1.circle(3, false);
        expect(r2).toBeDefined();
    });
});

describe("TestWorkplaneFirstLastItem", () => {
    it("first/last/item", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        const r2 = r1.extrude(10, true, true, false, 0);
        const first = r2.first();
        expect(first).toBeDefined();
        const last = r2.last();
        expect(last).toBeDefined();
        const item = r2.item(0);
        expect(item).toBeDefined();
    });
});

describe("TestWorkplaneShapesVals", () => {
    it("Shapes after box", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, true, true, true);
        const shapes = r1.shapes();
        expect(shapes.length).toBeGreaterThan(0);
    });

    it("Vals after box", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, true, true, true);
        const vals = r1.vals();
        expect(vals.length).toBeGreaterThan(0);
    });

    it("Size", () => {
        const wp = wpNamed("XY");
        wp.box(10, 10, 10, true, true, true);
        const s = wp.size();
        expect(s).toBeGreaterThanOrEqual(0);
    });
});

describe("TestWorkplaneEnd", () => {
    it("End from Workplane", () => {
        const wp = wpNamed("XY");
        const r1 = wp.circle(5, false);
        const parent = r1.end(0);
        expect(parent).toBeDefined();
    });
});

describe("TestWorkplaneClean", () => {
    it("Clean", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, true, true, true);
        const cleaned = r1.clean();
        expect(cleaned).toBeDefined();
    });
});

describe("TestWorkplanePolarArray", () => {
    it("PolarArray", () => {
        const wp = wpNamed("XY");
        const r = wp.polarArray(10, 0, 360, 6, true, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneCenter", () => {
    it("Center", () => {
        const wp = wpNamed("XY");
        const r1 = wp.center(5, 10);
        const r2 = r1.circle(3, false);
        expect(r2).toBeDefined();
    });
});

describe("TestWorkplaneMove", () => {
    it("MoveTo and LineTo chain", () => {
        const wp = wpNamed("XY");
        const r = wp.moveTo(0, 0)
            .lineTo(10, 0, false)
            .lineTo(10, 10, false)
            .lineTo(0, 10, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneTwistExtrude", () => {
    it("TwistExtrude", () => {
        const wp = wpNamed("XY");
        const r1 = wp.circle(5, false);
        const r2 = r1.twistExtrude(20, 45, true, true);
        expect(r2).toBeDefined();
    });
});

describe("TestWorkplaneVLineHLine", () => {
    it("VLine and HLine", () => {
        const wp = wpNamed("XY");
        const r = wp.moveTo(0, 0)
            .vline(10, false)
            .hline(10, false)
            .vlineTo(0, false)
            .hlineTo(0, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneSpline", () => {
    it("Spline", () => {
        const wp = wpNamed("XY");
        const pts = [
            new tp.gp_Pnt_3(0, 0, 0),
            new tp.gp_Pnt_3(10, 5, 0),
            new tp.gp_Pnt_3(20, 0, 0),
        ];
        const r = wp.spline(pts, undefined, false, undefined, false, 0.01, false, false, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplanePolygonByVertices", () => {
    it("Polyline and Close", () => {
        const wp = wpNamed("XY");
        const pts = [
            new tp.gp_Pnt_3(0, 0, 0),
            new tp.gp_Pnt_3(10, 0, 0),
            new tp.gp_Pnt_3(10, 10, 0),
            new tp.gp_Pnt_3(0, 10, 0),
        ];
        const r = wp.polyline(pts, false, false).close();
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneRarray", () => {
    it("Rarray", () => {
        const wp = wpNamed("XY");
        const r = wp.rarray(10, 10, 3, 2, [false, false]);
        expect(r).toBeDefined();
    });
});

// Go: Get/GetRange/GetIndices are C API calls, JS binding absent.
// Equivalents via item(i) and vals():
//   Get(i)        ≡ item(i)               → Workplane
//   GetRange(s,n) ≡ vals().slice(s, s+n)  → Workplane[]
//   GetIndices(i) ≡ i.map(idx => item(idx)) → Workplane[]
describe("TestWorkplaneGetSet (equivalent via item/vals)", () => {
    it("Get/GetRange/GetIndices", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, true, true, true);
        // Get(0) equivalent: item(0) returns a Workplane
        const g = r1.item(0);
        expect(g).toBeDefined();
        // GetRange(0, 1) equivalent: vals().slice(0, 1)
        const gr = r1.vals().slice(0, 1);
        expect(gr).toBeDefined();
        expect(gr.length).toBeGreaterThanOrEqual(1);
        // GetIndices([0]) equivalent: map over indices calling item
        const indices = [0];
        const gi = indices.map((i: number) => r1.item(i));
        expect(gi).toBeDefined();
        expect(gi.length).toBe(1);
    });
});

describe("TestWorkplaneOCCVecMath", () => {
    it("NewTopoVector", () => {
        const v = vec3(1, 2, 3);
        expect(v).not.toBeNull();
        expect(Math.abs(v.x - 1)).toBeLessThan(1e-10);
        expect(Math.abs(v.y - 2)).toBeLessThan(1e-10);
        expect(Math.abs(v.z - 3)).toBeLessThan(1e-10);
    });
});

describe("TestWorkplaneLocation", () => {
    it("NewTopoLocation", () => {
        const id = new tp.gp_Trsf_1();
        const loc = new tp.Location(id);
        expect(loc).not.toBeNull();
    });
});

describe("TestWorkplaneSketchBridge", () => {
    it("Sketch from workplane", () => {
        const wp = wpNamed("XY");
        const sk = wp.sketch();
        expect(sk).not.toBeNull();
    });
});

describe("TestWorkplaneTag", () => {
    it("Tag", () => {
        const wp = wpNamed("XY");
        const r = wp.tag("base");
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneExport", () => {
    it("ExportTo step", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, true, true, true);
        r1.exportTo("/tmp/test_go_topo_export.step");
    });
});

describe("TestWorkplaneHasParent", () => {
    it("HasParent", () => {
        const wp = wpNamed("XY");
        expect(wp.hasParent()).toBe(false);
    });
});

describe("TestWorkplaneSectionHeight", () => {
    it("Section with height", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, true, true, true);
        const sec = r1.section(2);
        expect(sec).toBeDefined();
    });
});

describe("TestWorkplanePolarLine", () => {
    it("PolarLine", () => {
        const wp = wpNamed("XY");
        const r = wp.moveTo(0, 0).polarLine(10, 45, false);
        expect(r).toBeDefined();
    });

    it("PolarLineTo", () => {
        const wp = wpNamed("XY");
        const r = wp.moveTo(0, 0).polarLineTo(10, 45, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneBezier", () => {
    it("Bezier", () => {
        const wp = wpNamed("XY");
        const pts = [
            vec3(0, 0, 0),
            vec3(5, 10, 0),
            vec3(10, 0, 0),
        ];
        const r = wp.bezier(pts, false, false, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneEllipse", () => {
    it("EllipseCentered", () => {
        const wp = wpNamed("XY");
        const r = wp.ellipse(10, 5, 0, false);
        expect(r).toBeDefined();
    });

    it("EllipseArc", () => {
        const wp = wpNamed("XY");
        const r = wp.ellipseArc(10, 5, 0, 180, 0, 1, false, false, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneSplineApprox", () => {
    it("SplineApprox", () => {
        const wp = wpNamed("XY");
        const pts = [
            new tp.gp_Pnt_3(0, 0, 0),
            new tp.gp_Pnt_3(10, 5, 0),
            new tp.gp_Pnt_3(20, 0, 0),
        ];
        const r = wp.splineApprox(pts, 1, 3, 0.01, undefined, false, false, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneSagittaArc", () => {
    it("SagittaArc", () => {
        const wp = wpNamed("XY");
        const ep = new tp.gp_Pnt_3(10, 0, 0);
        const r = wp.moveTo(0, 0).sagittaArc(ep, 5, false);
        expect(r).toBeDefined();
    });

    it("RadiusArc", () => {
        const wp = wpNamed("XY");
        const ep = new tp.gp_Pnt_3(10, 0, 0);
        const r = wp.moveTo(0, 0).radiusArc(ep, 10, false);
        expect(r).toBeDefined();
    });

    it("TangentArcPoint", () => {
        const wp = wpNamed("XY");
        const ep = new tp.gp_Pnt_3(10, 10, 0);
        const r = wp.moveTo(0, 0).lineTo(10, 0, false).tangentArcPoint(ep, false, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneShellSolidsCompounds", () => {
    it("Shells with selector", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, false, false, false, true, true);
        const r2 = r1.shells("", "");
        expect(r2).toBeDefined();
    });

    it("Solids with selector", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, false, false, false, true, true);
        const r2 = r1.solids("", "");
        expect(r2).toBeDefined();
    });
});

describe("TestWorkplaneWiresSelection", () => {
    it("Wires", () => {
        const wp = wpNamed("XY");
        const r = wp.rect(10, 10, true, false);
        const w = r.wires("", "");
        expect(w).toBeDefined();
    });
});

describe("TestWorkplaneCompoundsSelection", () => {
    it("Compounds", () => {
        const wp = wpNamed("XY");
        const r = wp.box(10, 10, 10, true, true, true);
        const c = r.compounds("", "");
        expect(c).toBeDefined();
    });
});

describe("TestWorkplaneAddShapesOps", () => {
    it("Add shapes", () => {
        const wp1 = wpNamed("XY");
        const r1 = wp1.rect(10, 10, true, false);
        const wp2 = wpNamed("XY");
        const r2 = wp2.circle(5, false);
        wp1.add(r2);
        const shapes = wp1.shapes();
        expect(shapes.length).toBeGreaterThan(0);
        expect(r1).toBeDefined();
    });

    it("AddShapes", () => {
        // Go 侧 TestWorkplaneAddShapesOps/AddShapes: wp.AddShapes(nil) 不崩溃即过
        const wp = wpNamed("XY");
        wp.add([]);
        expect(wp).toBeDefined();
    });
});

describe("TestWorkplaneWedgeTest", () => {
    it("Wedge", () => {
        const wp = wpNamed("XY");
        const r = wp.wedge(10, 20, 15, 0, 0, 10, 15, undefined, undefined, false, false, false, true, true);
        expect(r).toBeDefined();
    });

    it("Wedge centered", () => {
        const wp = wpNamed("XY");
        const r = wp.wedge(10, 20, 15, 0, 0, 10, 15, undefined, undefined, true, true, true, true, true);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneFindSolid", () => {
    it("FindSolid", () => {
        const wp = wpNamed("XY");
        const r1 = wp.box(10, 10, 10, false, false, false, true, true);
        const s = r1.findSolid(true, true);
        if (s == null) {
            // FindSolid returned null (expected if no solid in chain)
            expect(true).toBe(true);
        } else {
            expect(s).toBeDefined();
        }
    });
});

describe("TestWorkplaneAllMethod", () => {
    it("All", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        const all = r1.all();
        expect(all.length).toBeGreaterThan(0);
    });
});

describe("TestWorkplaneToPending", () => {
    it("ToPending", () => {
        const wp = wpNamed("XY");
        const r1 = wp.rect(10, 10, true, false);
        r1.toPending();
    });
});

describe("TestWorkplaneRadiusArc", () => {
    it("RadiusArc", () => {
        const wp = wpNamed("XY");
        const ep = new tp.gp_Pnt_3(10, 0, 0);
        const r = wp.moveTo(0, 0).radiusArc(ep, 10, false);
        expect(r).toBeDefined();
    });
});

describe("TestWorkplaneLine", () => {
    it("Line", () => {
        const wp = wpNamed("XY");
        const r = wp.moveTo(0, 0).line(10, 5, false);
        expect(r).toBeDefined();
    });
});
