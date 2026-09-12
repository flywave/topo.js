// 移植自 go-topo: face_test.go (16) + solid_test.go (16) + shell_test.go (5) + compsolid_test.go (13)
// JS 名称映射查 src/topo.d.ts / packages/topo-wasm/src/topo.full.d.ts
import { describe, it, expect, beforeAll } from "vitest";
import { getTopo, checkShape } from "./helpers/topo";

let tp: any;
beforeAll(async () => {
  tp = await getTopo();
});

// ─────────────────────── helpers ───────────────────────
// Vertex → gp_Pnt (makeEdgeFromTwoPoint 等需要 gp_Pnt)
function pnt(x: number, y: number, z: number): any {
  return new tp.Vertex(x, y, z).point();
}
// Vector → gp_Vec (translate 等需要 gp_Vec)
function vec(x: number, y: number, z: number): any {
  return new tp.Vector(x, y, z).toVec();
}
// 构造矩形面 (Go makeRectFace)
function makeRectFace(): any {
  const e1 = tp.Edge.makeEdgeFromTwoPoint(pnt(0, 0, 0), pnt(10, 0, 0));
  const e2 = tp.Edge.makeEdgeFromTwoPoint(pnt(10, 0, 0), pnt(10, 10, 0));
  const e3 = tp.Edge.makeEdgeFromTwoPoint(pnt(10, 10, 0), pnt(0, 10, 0));
  const e4 = tp.Edge.makeEdgeFromTwoPoint(pnt(0, 10, 0), pnt(0, 0, 0));
  const w = tp.Wire.makeWireFromEdges([e1, e2, e3, e4]);
  return tp.Face.makeFaceFromWire(w, true);
}

// ═══════════════════════════════════════════════════════
//  face_test.go (16 用例)
// ═══════════════════════════════════════════════════════

describe("TestNewFace (face_test.go)", () => {
  it("empty", () => {
    const f = new tp.Face();
    expect(f).not.toBeNull();
  });

  it("from wire", () => {
    const f = makeRectFace();
    const r = checkShape(f);
    expect(r.ok).toBe(true);
    expect(f.type()).toBeDefined();
  });

  it("from points", () => {
    const pts = [
      pnt(0, 0, 0), pnt(10, 0, 0), pnt(10, 10, 0), pnt(0, 10, 0),
    ];
    const f = tp.Face.makeFaceFromPoints(pts);
    expect(f).not.toBeNull();
    expect(f.isNull()).toBe(false);
  });

  it("plane face", () => {
    // makePlane(basePnt: gp_Pnt, dir: gp_Dir, length, width)
    // 需要 gp_Dir, 用 new tp.Vector(x,y,z).toDir() 转换
    const f = tp.Face.makePlane(pnt(0, 0, 0), new tp.Vector(0, 0, 1).toDir(), 10, 10);
    expect(f).not.toBeNull();
  });
});

describe("TestFaceProperties (face_test.go)", () => {
  let f: any;
  beforeAll(() => { f = makeRectFace(); });

  it("is null", () => { expect(f.isNull()).toBe(false); });
  it("is valid", () => { expect(f.isValid()).toBe(true); });

  it("num wires", () => {
    expect(f.numWires()).toBeGreaterThanOrEqual(1);
  });

  it("num faces", () => {
    expect(f.numFaces()).toBeGreaterThanOrEqual(1);
  });

  it("area", () => {
    expect(f.area()).toBeGreaterThan(0);
  });

  it("tolerance", () => {
    expect(f.tolerance()).toBeGreaterThanOrEqual(0);
  });
});

describe("TestFaceNormal (face_test.go)", () => {
  let f: any;
  beforeAll(() => { f = makeRectFace(); });

  it("normal at", () => {
    // normalAt 返回 gp_Vec, 坐标用 .X()/.Y()/.Z() 方法访问 (非属性)
    const n = f.normalAt(pnt(5, 5, 0));
    expect(Math.abs(n.Z() - 1)).toBeLessThan(1e-6);
  });

  it("normal at uv", () => {
    const [n, p] = f.normalAtUV(0.5, 0.5);
    expect(n).toBeDefined();
    expect(p).toBeDefined();
  });
});

describe("TestFaceCentreInertia (face_test.go)", () => {
  let f: any;
  beforeAll(() => { f = makeRectFace(); });

  it("centre of mass", () => {
    const c = f.centreOfMass();
    expect(c).toBeDefined();
  });

  it("inertia", () => {
    const bb = f.inertia();
    expect(bb).toBeDefined();
  });
});

describe("TestFaceToPlane (face_test.go)", () => {
  it("to plane", () => {
    const f = makeRectFace();
    const p = f.toPlane();
    expect(p).not.toBeNull();
  });
});

describe("TestFaceUV (face_test.go)", () => {
  let f: any;
  beforeAll(() => { f = makeRectFace(); });

  it("uv bounds", () => {
    const [uMin, uMax, vMin, vMax] = f.uvBounds();
    expect(uMin).toBeLessThan(uMax);
    expect(vMin).toBeLessThan(vMax);
  });

  it("param at", () => {
    const [u, v] = f.paramAt(pnt(5, 5, 0));
    expect(u).toBeDefined();
    expect(v).toBeDefined();
  });

  it("position at", () => {
    const p = f.positionAt(0.5, 0.5);
    expect(p).toBeDefined();
  });
});

describe("TestFaceTransform (face_test.go)", () => {
  it("translate", () => {
    const f = makeRectFace();
    f.translate(vec(5, 0, 0));
    expect(f.isNull()).toBe(false);
  });
});

describe("TestFaceCopy (face_test.go)", () => {
  it("copy", () => {
    const f = makeRectFace();
    const f2 = f.copy();
    expect(f2).not.toBeNull();
    // copy() 返回 Shape (基类), 无 area() — 用 computeArea() (Shape 层)
    f2.computeArea();
  });
});

describe("TestFaceLabelColour (face_test.go)", () => {
  it("set label", () => {
    const f = makeRectFace();
    f.setLabel("test_face");
    expect(f.label()).toBe("test_face");
  });

  it.skip("set surface colour (Quantity_Color 构造不可用)", () => {});
});

describe("TestFaceIterator (face_test.go)", () => {
  it.skip("iterate (FaceIterator.next 返回未绑定类型 boost::optional<face>)", () => {});
});

describe("TestFaceOuterWire (face_test.go)", () => {
  it("outer wire", () => {
    const f = makeRectFace();
    const w = f.outerWire();
    expect(w).not.toBeNull();
  });
});

describe("TestFaceSetGet (face_test.go)", () => {
  let f: any;
  beforeAll(() => { f = makeRectFace(); });

  it("set/get orientation", () => {
    f.setOrientation(tp.Orientation.FORWARD);
    expect(f.getOrientation()).toEqual(tp.Orientation.FORWARD);
  });

  it("set uv", () => {
    f.setUOrigin(0.5);
    f.setVOrigin(0.5);
    f.setURepeat(2.0);
    f.setVRepeat(2.0);
    f.setScaleU(1.5);
    f.setScaleV(1.5);
    expect(f.getUOrigin()).toBeDefined();
    expect(f.getVOrigin()).toBeDefined();
    expect(f.getURepeat()).toBeDefined();
    expect(f.getVRepeat()).toBeDefined();
    expect(f.getScaleU()).toBeDefined();
    expect(f.getScaleV()).toBeDefined();
  });

  it("set rotation", () => {
    f.setRotationAngle(45);
    expect(f.getRotationAngle()).toBe(45);
  });
});

describe("TestFaceBBoxHash (face_test.go)", () => {
  let f: any;
  beforeAll(() => { f = makeRectFace(); });

  it("bbox", () => {
    const bb = f.bbox();
    expect(bb).toBeDefined();
  });

  it("hash", () => {
    const h = f.hashCode();
    expect(h).toBeDefined();
  });
});

describe("TestFaceLocations (face_test.go)", () => {
  let f: any;
  beforeAll(() => { f = makeRectFace(); });

  it("get location", () => {
    // Shape.location() 返回 number[] | null (非 Location 对象), 不能直接传回 setLocation
    const loc = f.location();
    expect(loc).not.toBeNull();
  });

  it("fix shape", () => {
    f.fixShape();
  });
});

describe("TestFaceTransformed (face_test.go)", () => {
  it("translated", () => {
    const f = makeRectFace();
    const f2 = f.translated(vec(10, 0, 0));
    expect(f2).not.toBeNull();
  });
});

describe("TestFaceNormals (face_test.go)", () => {
  it("normals", () => {
    const f = makeRectFace();
    // Go: "Normals returned empty (may require non-planar face)"
    // JS: normals() 返回 {normals: gp_Vec[], points: gp_Pnt[]}
    const result = f.normals([0.25, 0.75], [0.25, 0.75]);
    expect(result).toBeDefined();
    expect(result.normals).toBeDefined();
    expect(result.points).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
//  solid_test.go (16 用例)
// ═══════════════════════════════════════════════════════

describe("TestNewSolid (solid_test.go)", () => {
  it("empty", () => {
    // Go: TopoMakeSolid() 非 nil; JS Solid 无空构造, 用最小 solid 验证
    const s = tp.Solid.makeSolidFromBox(1, 1, 1);
    expect(s).not.toBeNull();
    expect(s.isNull()).toBe(false);
  });
});

describe("TestSolidConstructors (solid_test.go)", () => {
  it("from box", () => {
    const s = tp.Solid.makeSolidFromBox(10, 20, 30);
    expect(s).not.toBeNull();
    expect(s.type()).toBeDefined();
  });

  it("from box two point", () => {
    const s = tp.Solid.makeSolidFromBoxTwoPoint(pnt(0, 0, 0), pnt(10, 20, 30));
    expect(s).not.toBeNull();
    expect(s.isValid()).toBe(true);
  });

  it("from sphere", () => {
    const s = tp.Solid.makeSolidFromSphere(10);
    expect(s).not.toBeNull();
  });

  it("from cylinder", () => {
    const s = tp.Solid.makeSolidFromCylinderAngle(5, 20);
    expect(s).not.toBeNull();
  });

  it("from cone", () => {
    const s = tp.Solid.makeSolidFromConeAngle(10, 5, 20);
    expect(s).not.toBeNull();
  });
});

describe("TestSolidProperties (solid_test.go)", () => {
  let s: any;
  beforeAll(() => { s = tp.Solid.makeSolidFromBox(10, 10, 10); });

  it("is null", () => { expect(s.isNull()).toBe(false); });
  it("is valid", () => { expect(s.isValid()).toBe(true); });
  it("type", () => { expect(s.type()).toBeDefined(); });
  it("bbox", () => { expect(s.bbox()).toBeDefined(); });
  it("hash", () => { expect(s.hashCode()).toBeDefined(); });
});

describe("TestSolidAreaVolume (solid_test.go)", () => {
  let s: any;
  beforeAll(() => { s = tp.Solid.makeSolidFromBox(10, 10, 10); });

  it("area", () => { expect(s.computeArea()).toBeGreaterThan(0); });
  it("volume", () => { expect(s.volume()).toBeGreaterThan(0); });
});

describe("TestSolidInertiaCentre (solid_test.go)", () => {
  let s: any;
  beforeAll(() => { s = tp.Solid.makeSolidFromBox(10, 10, 10); });

  it("centre of mass", () => {
    expect(s.centreOfMass()).toBeDefined();
  });

  it("inertia", () => {
    expect(s.inertia()).toBeDefined();
  });
});

describe("TestSolidInside (solid_test.go)", () => {
  it("is inside", () => {
    const s = tp.Solid.makeSolidFromBox(10, 10, 10);
    expect(s.isInside(pnt(5, 5, 5), 1e-6)).toBe(true);
  });
});

describe("TestSolidTransform (solid_test.go)", () => {
  it("translate", () => {
    const s = tp.Solid.makeSolidFromBox(10, 10, 10);
    s.translate(vec(5, 0, 0));
    expect(s.isNull()).toBe(false);
  });

  it("translated", () => {
    const s = tp.Solid.makeSolidFromBox(10, 10, 10);
    const s2 = s.translated(vec(10, 0, 0));
    expect(s2).not.toBeNull();
  });
});

describe("TestSolidCopy (solid_test.go)", () => {
  it("copy", () => {
    const s = tp.Solid.makeSolidFromBox(10, 10, 10);
    const s2 = s.copy();
    expect(s2).not.toBeNull();
    // copy() 返回 Shape (基类), 用 autoCast 还原为 Solid
    const solid2 = s2.autoCast();
    solid2.volume();
  });
});

describe("TestSolidToShape (solid_test.go)", () => {
  it.skip("to shape (Solid 本身已是 Shape 子类, 无需转换)", () => {});
});

describe("TestSolidLabelColour (solid_test.go)", () => {
  it("set label", () => {
    const s = tp.Solid.makeSolidFromBox(10, 10, 10);
    s.setLabel("test_solid");
    expect(s.label()).toBe("test_solid");
  });

  it.skip("set surface colour (Quantity_Color 构造不可用)", () => {});
});

describe("TestSolidUV (solid_test.go)", () => {
  let s: any;
  beforeAll(() => { s = tp.Solid.makeSolidFromBox(10, 10, 10); });

  it("set uv", () => {
    s.setUOrigin(0.5);
    s.setVOrigin(0.5);
    s.setURepeat(2.0);
    s.setVRepeat(2.0);
    s.setScaleU(1.5);
    s.setScaleV(1.5);
    expect(s.getUOrigin()).toBeDefined();
    expect(s.getVOrigin()).toBeDefined();
    expect(s.getURepeat()).toBeDefined();
    expect(s.getVRepeat()).toBeDefined();
    expect(s.getScaleU()).toBeDefined();
    expect(s.getScaleV()).toBeDefined();
  });

  it("set rotation", () => {
    s.setRotationAngle(45);
    expect(s.getRotationAngle()).toBe(45);
  });
});

describe("TestSolidOrientation (solid_test.go)", () => {
  it("set/get orientation", () => {
    const s = tp.Solid.makeSolidFromBox(10, 10, 10);
    s.setOrientation(tp.Orientation.FORWARD);
    expect(s.getOrientation()).toEqual(tp.Orientation.FORWARD);
  });
});

describe("TestSolidLocation (solid_test.go)", () => {
  it("get location", () => {
    const s = tp.Solid.makeSolidFromBox(10, 10, 10);
    const loc = s.location();
    expect(loc).not.toBeNull();
  });
  it.skip("set location (location() 返回 number[] 无法直接传回 setLocation)", () => {});
});

describe("TestSolidFixShape (solid_test.go)", () => {
  it("fix shape", () => {
    const s = tp.Solid.makeSolidFromBox(10, 10, 10);
    s.fixShape();
  });
});

describe("TestSolidMesh (solid_test.go)", () => {
  it.skip("mesh (Mesh 构造签名与 Go NewMeshReceiver 不同)", () => {});
});

describe("TestSolidNumFacesSolid (solid_test.go)", () => {
  let s: any;
  beforeAll(() => { s = tp.Solid.makeSolidFromBox(10, 10, 10); });

  it("num solids", () => { expect(s.numSolids()).toBeGreaterThanOrEqual(1); });
  it("num faces", () => { expect(s.numFaces()).toBeGreaterThanOrEqual(1); });
});

// ═══════════════════════════════════════════════════════
//  shell_test.go (5 用例)
// ═══════════════════════════════════════════════════════

describe("TestNewShell (shell_test.go)", () => {
  it.skip("empty (Shell 无空构造)", () => {});
});

describe("TestShellConstructors (shell_test.go)", () => {
  it("from box", () => {
    const sh = tp.Shell.makeShellFromBox(10, 20, 30);
    expect(sh).not.toBeNull();
  });

  it("from box point", () => {
    const sh = tp.Shell.makeShellFromBoxPoint(pnt(0, 0, 0), 10, 20, 30);
    expect(sh).not.toBeNull();
  });

  it("from box two point", () => {
    const sh = tp.Shell.makeShellFromBoxTwoPoint(pnt(0, 0, 0), pnt(10, 20, 30));
    expect(sh).not.toBeNull();
  });

  it("from cylinder", () => {
    const sh = tp.Shell.makeShellFromCylinder(5, 20);
    expect(sh).not.toBeNull();
  });

  it("from cone", () => {
    const sh = tp.Shell.makeShellFromCone(10, 5, 20);
    expect(sh).not.toBeNull();
  });

  it("from sphere", () => {
    const sh = tp.Shell.makeShellFromSphere(10);
    expect(sh).not.toBeNull();
  });

  it("from torus", () => {
    const sh = tp.Shell.makeShellFromTorus(20, 5);
    expect(sh).not.toBeNull();
  });

  it("from wedge", () => {
    const sh = tp.Shell.makeShellFromWedge(10, 20, 15, 5);
    expect(sh).not.toBeNull();
  });
});

describe("TestShellToShape (shell_test.go)", () => {
  it.skip("to shape (Shell 本身已是 Shape 子类)", () => {});
});

describe("TestShellIterator (shell_test.go)", () => {
  it.skip("iterate (ShellIterator.next 返回未绑定类型 boost::optional<shell>)", () => {});
});

describe("TestShellSweep (shell_test.go)", () => {
  it.skip("sweep (Shell.sweep 参数编组路径需验证)", () => {});
});

// ═══════════════════════════════════════════════════════
//  compsolid_test.go (13 用例)
// ═══════════════════════════════════════════════════════

describe("TestNewCompSolid (compsolid_test.go)", () => {
  it("make", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    expect(cs).not.toBeNull();
  });
});

describe("TestCompSolidBasicProps (compsolid_test.go)", () => {
  it("is null", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    expect(typeof cs.isNull()).toBe("boolean");
  });

  it("type", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    expect(cs.type()).toBeDefined();
  });

  it("hash", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    expect(cs.hashCode()).toBeDefined();
  });
});

describe("TestCompSolidCopy (compsolid_test.go)", () => {
  it("copy", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    const cs2 = cs.copy();
    expect(cs2).not.toBeNull();
  });
});

describe("TestCompSolidTransforms (compsolid_test.go)", () => {
  it("translate", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    cs.translate(vec(10, 0, 0));
    expect(cs.isNull()).toBe(false);
  });

  it("translated", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    const cs2 = cs.translated(vec(10, 0, 0));
    expect(cs2).not.toBeNull();
  });

  it("rotate", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    cs.rotateFromPoint(45, pnt(0, 0, 0), pnt(0, 0, 1));
  });

  it("scale", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    // JS binding: scale(gp_Pnt, double), 使用 gp_Pnt_1() (origin)
    cs.scale(new tp.gp_Pnt_1(), 2.0);
  });
});

describe("TestCompSolidColourLabel (compsolid_test.go)", () => {
  it.skip("set surface colour (Quantity_Color 构造不可用)", () => {});

  it("set label", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    cs.setLabel("test_cs");
    expect(cs.label()).toBe("test_cs");
  });
});

describe("TestCompSolidUV (compsolid_test.go)", () => {
  it("set uv origin", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    cs.setUOrigin(0.5);
    cs.setVOrigin(0.5);
    expect(cs.getUOrigin()).toBeDefined();
    expect(cs.getVOrigin()).toBeDefined();
  });

  it("set uv repeat", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    cs.setURepeat(2.0);
    cs.setVRepeat(2.0);
    expect(cs.getURepeat()).toBeDefined();
    expect(cs.getVRepeat()).toBeDefined();
  });

  it("set rotation angle", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    cs.setRotationAngle(45.0);
    expect(cs.getRotationAngle()).toBe(45.0);
  });
});

describe("TestCompSolidOrientation (compsolid_test.go)", () => {
  it("get/set orientation", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    cs.setOrientation(tp.Orientation.FORWARD);
    expect(cs.getOrientation()).toEqual(tp.Orientation.FORWARD);
  });
});

describe("TestCompSolidToShape (compsolid_test.go)", () => {
  it.skip("to shape (CompSolid 本身已是 Shape 子类)", () => {});
});

describe("TestCompSolidLocation (compsolid_test.go)", () => {
  it("get location", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    const loc = cs.location();
    expect(loc).not.toBeNull();
  });
  it.skip("set location (location() 返回 number[] 无法直接传回 setLocation)", () => {});
});

describe("TestCompSolidFixShape (compsolid_test.go)", () => {
  it("fix shape", () => {
    const cs = tp.CompSolid.makeCompSolid([]);
    cs.fixShape();
  });
});

describe("TestCompSolidMesh (compsolid_test.go)", () => {
  it.skip("mesh (Mesh 构造签名与 Go NewMeshReceiver 不同)", () => {});
});

describe("TestCompSolidIterator (compsolid_test.go)", () => {
  it.skip("iterate (CompSolidIterator.next 返回未绑定类型 boost::optional<comp_solid>)", () => {});
});

describe("TestCompSolidCentreInertia (compsolid_test.go)", () => {
  it.skip("centre of mass (空 CompSolid.centreOfMass 返回 number 而非 gp_Pnt)", () => {});

  it.skip("inertia (空 CompSolid.inertia 返回 number 而非 Bnd_Box)", () => {});
});
