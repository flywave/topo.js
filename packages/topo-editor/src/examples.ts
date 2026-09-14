/**
 * Built-in example snippets for topo-editor.
 * Each snippet uses APIs verified in the test suite:
 *   - cq_examples.test.ts  (CQWorkplane / pnt / vec / gpVec)
 *   - cq_sketch_solver.test.ts (Sketch constraint solver)
 *   - cq_assembly_solve.test.ts (Assembly constraint solver)
 */

export interface Example {
  label: string;
  code: string;
}

export const examples: Example[] = [
  // -----------------------------------------------------------------------
  // 1. CQ basics — boxCentered + fillet
  //    Ref: cq_examples.test.ts example_01 + example_06
  // -----------------------------------------------------------------------
  {
    label: "1 — Box + Fillet",
    code: `// CQ basics: boxCentered + fillet on edges
// Ref: cq_examples.test.ts example_01, example_06
const wp = new CQWorkplane(tp);
const shape = wp.boxCentered(3, 3, 0.5)
  .edges("|Z", "")
  .fillet(0.125);
render(shape);
`,
  },

  // -----------------------------------------------------------------------
  // 2. Plate with hole — box + faces + workplane + holeThrough
  //    Ref: cq_examples.test.ts example_02_plateWithHole
  // -----------------------------------------------------------------------
  {
    label: "2 — Plate with Hole",
    code: `// Plate with centered hole: box → faces(">Z") → workplane → holeThrough
// Ref: cq_examples.test.ts example_02_plateWithHole
const L = 80, H = 60, T = 10, dia = 22;
const wp = new CQWorkplane(tp);
const shape = wp.boxCentered(L, H, T)
  .faces(">Z", "")
  .workplane(0, false, 0)
  .holeThrough(dia);
render(shape);
`,
  },

  // -----------------------------------------------------------------------
  // 3. OCC Bottle — center + vline + threePointArc + mirrorX + extrude + shell
  //    Ref: cq_examples.test.ts example_28_occBottle
  //    Note: shell kind MUST be "arc", NOT "" (empty string throws Unknown join type)
  // -----------------------------------------------------------------------
  {
    label: "3 — OCC Bottle",
    code: `// OCC bottle: center → vline → threePointArc → mirrorX → extrude → shell
// Ref: cq_examples.test.ts example_28_occBottle
// NOTE: shell kind must be "arc", NOT "" (empty string throws Unknown join type)
const L = 20, w = 6, thick = 3;
const wp = new CQWorkplane(tp);
let p = wp.center(-L / 2, 0).vline(w / 2, false);
p = p.threePointArc(
  pnt(tp, L / 2, w / 2 + thick, 0),
  pnt(tp, L, w / 2, 0),
  false
);
p = p.vline(-w / 2, false).mirrorX().extrudeSimple(30);
// Add neck cap
p = p.faces(">Z", "").workplane(0, false, 1)
  .circleCentered(3).extrudeSimple(2);
// Shell the body — use "arc" join type
let r = p.faces(">Z", "").shell(0.3, "arc");
render(r);
`,
  },

  // -----------------------------------------------------------------------
  // 4. Boolean composite — multiple boxes fused and cut
  //    Ref: shape_ops tests / cq cut/union patterns
  // -----------------------------------------------------------------------
  {
    label: "4 — Boolean Composite",
    code: `// Boolean ops: fuse two boxes, then cut a cylinder through
// Ref: cq_examples test patterns (cut/union)
const wp1 = new CQWorkplane(tp);
const base = wp1.boxCentered(4, 4, 1);

const wp2 = new CQWorkplane(tp, "XY", vec(tp, 1, 0, 0));
const pillar = wp2.boxCentered(1, 1, 3);

const fused = base.union(pillar, true, false, 0.001);

// Cut a hole through the center
// 注意: 切割工具用 cylinder() 直接成型 — go-topo 的 _cut 经 select_shapes(vals())
// 提取工具, 给"画圆再挤出"的 workplane 会错取轮廓 face 导致切空 (Go 侧同现)
const wp3 = new CQWorkplane(tp);
const cutter = wp3.unwrap().cylinder(5, 0.5, undefined, 360, true, true, true);
const result = fused.cut(cutter, true, 0.001);
render(result);
`,
  },

  // -----------------------------------------------------------------------
  // 5. Sketch constraint solver — segment + LENGTH + solve
  //    Ref: cq_sketch_solver.test.ts
  // -----------------------------------------------------------------------
  {
    label: "5 — Sketch Solver",
    code: `// Sketch constraint solver: 求解前后对比 (原始 10 长线段 → 约束长度 5)
// Ref: cq_sketch_solver.test.ts TestSketchSolver_SingleConstraint
// 注意: go-topo 的 sketch.solve() 不回写可渲染实体 (求解结果在 solve_status().x),
//       可视化需从 x 重绘求解后几何 — 单行 DOF 无顺序歧义, 多实体见 cq_sketch_solver 测试
const strip = (x1, y1, x2, y2, yOff) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + yOff;
  return new tp.Workplane().box(len, 0.4, 0.4, true, true, true)
    .translate(gpVec(tp, cx, cy, 0)).val();
};

const wp0 = new tp.Workplane("XY", vec(tp, 0, 0, 0), undefined);
const sk = wp0.sketch();
sk.segmentBetweenPoints(vec(tp, 0, 0, 0), vec(tp, 10, 0, 0), "e1", false);

// LENGTH=5 收缩 + FIXED_POINT(t=0) 锚定起点
sk.constrain("e1", tp.SketchConstraintKind.LENGTH, 5);
sk.constrain("e1", tp.SketchConstraintKind.FIXED_POINT, 0);
sk.solve();

const st = sk.solve_status();
console.log("Solver status:", st.status, "cost:", st.cost, "DOF:", st.x);
// st.status 1-4 = NLopt 成功; st.x[0] = [x1,y1,x2,y2] 求解后线段端点

const [x1, y1, x2, y2] = st.x[0];
render(strip(0, 0, 10, 0, 0));      // 下方: 原始 10 长
render(strip(x1, y1, x2, y2, 3));   // 上方: 求解后 5 长 (平移错开展示)
`,
  },

  // -----------------------------------------------------------------------
  // 6. Assembly constraint solver — Fixed + Point + solve
  //    Ref: cq_assembly_solve.test.ts
  // -----------------------------------------------------------------------
  {
    label: "6 — Assembly Solve",
    code: `// Assembly constraint solver: FixedPoint 把 part 钉到目标点 (前后对比)
// Ref: cq_assembly_solve.test.ts
const rootShp = new CQWorkplane(tp, "XY").boxCentered(10, 10, 10).value();
const childShp = new CQWorkplane(tp, "XY").boxCentered(5, 5, 5).value();

const as = tp.Assembly.create(rootShp, undefined, "root");
// 初始: part 放到远处 (20, 20, 20)
as.add(childShp, new tp.Location(new tp.gp_Vec_4(20, 20, 20)), "part");

// 求解前快照, 平移到 y=-20 与求解后错开展示
const before = as.toCompound().translated(gpVec(tp, 0, -20, 0));

// 固定 root, 约束 part 的参考点钉到 (15, 0, 0) (root 旁边, 效果可见)
as.constrain1("root", tp.AssemblyConstraintKind.Fixed, 0);
as.constrain1("part", tp.AssemblyConstraintKind.FixedPoint, [15, 0, 0]);
as.solve(0);

if (as.hasError()) {
  console.log("Assembly error:", as.getError());
} else {
  console.log("Assembly solved: part (20,20,20) → (15,0,0)");
}

render(before);           // 下方: 初始状态 (root 与远处的 part)
render(as.toCompound());  // 原位: 求解后 (part 被钉到 root 旁边)
`,
  },

  // -----------------------------------------------------------------------
  // 7. Revolve — revolveSimple
  //    Ref: cq_examples.test.ts example_21_extrudeToFace (uses revolveSimple)
  // -----------------------------------------------------------------------
  {
    label: "7 — Revolve",
    code: `// Revolve: 闭合折线轮廓(偏离转轴) 绕 Y 轴旋转 360°
// 注意: go-topo 的 topo::revolve 对"旋转轴穿过截面"的情形静默跳过产空
// (Go 侧同现, _revolve 内 try/catch 静默) — CadQuery 标准做法就是偏移轮廓
const profile = [
  pnt(tp, 1, 0, 0),
  pnt(tp, 2, 0, 0),
  pnt(tp, 2, 1, 0),
  pnt(tp, 1, 1, 0),
];
const shape = new CQWorkplane(tp)
  .polyline(profile, false, false)
  .close()
  .unwrap()
  .revolve(360, pnt(tp, 0, 0, 0), pnt(tp, 0, 1, 0), true, true);
render(shape);
`,
  },

  // -----------------------------------------------------------------------
  // 8. Loft — two cross-sections lofted
  //    Ref: cq_examples.test.ts example_20_loft
  // -----------------------------------------------------------------------
  {
    label: "8 — Loft",
    code: `// Loft: box base → circle on face → rect on offset workplane → loft
// Ref: cq_examples.test.ts example_20_loft
const wp = new CQWorkplane(tp);
let r = wp.boxCentered(4, 4, 0.25);
// Circle cross-section on top face
r = r.faces(">Z", "").circleCentered(1.5);
// Rect cross-section on offset workplane
r = r.workplane(3.0, false, 0).rectCentered(0.75, 0.5).loftSimple();
render(r);
`,
  },

  // -----------------------------------------------------------------------
  // 9. Multi-render — render() called multiple times
  //    Verifies runner's render-collect contract
  // -----------------------------------------------------------------------
  {
    label: "9 — Multi-Render",
    code: `// Multi-render: call render() multiple times to show multiple shapes
// Verifies runner's render-collect contract
const wp1 = new CQWorkplane(tp);
const box = wp1.boxCentered(2, 2, 2);
render(box);

const wp2 = new CQWorkplane(tp, "XY", vec(tp, 5, 0, 0));
const sphere = wp2.circleCentered(1).extrudeSimple(1);
render(sphere);

const wp3 = new CQWorkplane(tp, "XY", vec(tp, -5, 0, 0));
const cyl = wp3.circleCentered(0.8).extrudeSimple(3);
render(cyl);
`,
  },

  // -----------------------------------------------------------------------
  // 10. Workplane chaining — line, arc, close, extrude
  //     Ref: cq_examples.test.ts example_04_lineAndArc
  // -----------------------------------------------------------------------
  {
    label: "10 — Line & Arc",
    code: `// Workplane chaining: line → line → threePointArc → close → extrude
// Ref: cq_examples.test.ts example_04_lineAndArc
const wp = new CQWorkplane(tp);
let r = wp.lineTo(2, 0, false);
r = r.lineTo(2, 1, false);
r = r.threePointArc(pnt(tp, 1, 1.5, 0), pnt(tp, 0, 1, 0), false);
r = r.close().extrudeSimple(0.25);
render(r);
`,
  },
];
