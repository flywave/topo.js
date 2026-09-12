# topo.js

go-topo (OpenCASCADE C++ 几何内核) 的 WASM 移植: Emscripten 编译 + Embind 绑定 + TS SDK。pnpm + lerna monorepo。

## 项目结构

- `gen/` — Go 构建工具链 (Clang AST → Embind 绑定生成 → emcc 并行编译 → 链接 → TS 声明生成)
- `src/` — Embind C++ 绑定 (`topo_bindings.cc` / `primitives_bindings.cc` / ...) + 手写 `.d.ts`
- `packages/topo-wasm/` — WASM 产物包 (`src/topo.full.{js,wasm,d.ts}`, 已预编译入库)
- `packages/topo-primitives/` — 参数化 Primitive 类 (`lib/`, 含 `lib/railway/` 52 个铁路类 + 布局闭环)
- `packages/topo-threejs/` / `packages/topo-js/` — Three.js 桥接 / 高层 API
- `packages/topo-example/` — 示例应用 (webpack)

## 构建

```sh
# 日常快速重编 (跳过 OCCT): 本机需显式指定系统 clang,
# PATH 中靠前的 OpenHarmony clang 会搞坏 gen 工具的 AST 解析
CC=/usr/bin/clang CXX=/usr/bin/clang++ make rebuild

make            # 完整构建 (OCCT + go-topo + bindings + 链接)
make clean      # 清理构建产物
```

**mtime 增量坑**: `gen/compile.go` 只按 `.cc` 源文件与 `.o` 的 mtime 判断是否重编, **不追踪头文件依赖** — 改了 `.hh` 或 go-topo 侧头文件后, 依赖它的 `.o` 不会自动重编, 需手动删除对应 `.o` 或 `touch` 源文件, 否则链接进的还是旧实现。

**孤儿 .o 坑**: 链接按 glob 收集 `build/src/**/*.o` (`gen/build.go`) — go-topo 侧**删除/重命名**源文件后 (如 2026-09 `primitives.cc` 拆分为 5 个专业文件), 残留的旧 `.o` 会被一并链接, 造成重复符号; 需手动 `rm build/src/*.o` 再重编。

**编译错误必须看日志**: gen 的 `runWorkers` 现已向上传播编译错误 (2026-09 修复, 此前单个 `.cc` 编译失败只打印不报错, `make rebuild` 仍绿 — `sketch_bindings.cc` 曾因此长期缺席 wasm 而无人察觉)。改绑定后若行为不符, 先查构建日志有没有编译失败。

**NLopt**: `make rebuild`/`all` 序列含 `nlopt` 步骤 (`gen/compile_nlopt.go`, 编译 `../go-topo/external/nlopt/src` 的 48 个 .c → `build/src/nlopt/`); cmake 配置头不自动生成, 手维护在 `external/nlopt-wasm/` (`nlopt_config.h` + `nlopt.hpp`), nlopt 升级时需重新审阅。

## 测试

```sh
pnpm --filter topo-primitives test        # vitest run, 全量
pnpm --filter topo-primitives test:watch  # watch 模式
```

- 宿主包: `packages/topo-primitives` (vitest 0.28, 与 topo-js 一致; 配置 `vitest.config.ts`: node 环境, `threads: false` 单线程, `testTimeout` 180s — 重几何用例如道岔/站场再生成单文件可达数分钟)
- `test/helpers/topo.ts` — WASM 加载模块级单例: ES6 import `topo.full.js` + `readFileSync` wasm + `{ wasmBinary }`, 每个测试文件初始化一次
- `test/railway_primitives.test.ts` — 52 个铁路 Primitive 类冒烟 (`setDefault` → `build` → shape 非空 / bbox 有限)
- `test/railway_layout.test.ts` — 锚段/站场布局闭环 (计算口径 / JSON 往返 / 命名唯一 / 编辑再生成 bbox / 与 Go layout JSON 互通)
- `test/cq_examples.test.ts` — 33 个 CadQuery 官方示例 1:1 移植 (与 go-topo `workplane_examples_test.go` 逐行对应), 与 Go 侧提取的 golden bbox (`test/cq/goldens.json`, 35 条, 口径 = `Value()` 栈首对象 bbox) 逐坐标对账 (容差 1e-6)
- 绑定层全量覆盖 (移植 go-topo 同名 Go 测试, parity 断言; skip 项 = 绑定缺口, 见"已知坑"的缺口清单):
  - `test/shapes_edge_wire.test.ts` / `shapes_face_solid.test.ts` / `shapes_compound.test.ts` — 核心形状族 (Edge/Wire/Vertex/Face/Solid/Shell/CompSolid/Compound/Shape)
  - `test/shape_ops_selector.test.ts` — ShapeOps + Selector
  - `test/geometry_mesh_standard.test.ts` — GeometryCreator/gp 几何类型/mesh/standard
  - `test/workplane_full.test.ts` / `sketch_ops.test.ts` / `assembly_full.test.ts` — Workplane/Sketch/Assembly 全方法
  - `test/primitives_{foundation,gasket_anchor,cable_stretch,plate_steel_infra}.test.ts` — 非铁路 create_* 族 (约 300 例, value_object 参数全字段初始化 + enum 传枚举对象)

## CadQuery 兼容层

- **`packages/topo-primitives/lib/cq/index.ts`** — `CQWorkplane` 链式 shim (经 `lib/index.ts` 以 `CQ` 命名空间导出), 方法名与 go-topo `workplane.go` 的 Go 便捷封装一一对应 (`boxCentered`/`circleCentered`/`extrudeSimple`/`holeThrough`/`loftSimple` 等), 内部调 Embind 绑定的 `tp.Workplane` 并负责参数换序/枚举映射 (`cutThruAll(taper,clean)` 换序、`workplane()` centerOption 数字→枚举、`offset2D` kind 数字→`GeomAbs_JoinType` 数值、`rarray` center→二元数组)。helper: `pnt/vec/gpVec` (gp_Pnt/Vector/gp_Vec 构造)
- **`box` 绑定** (`src/workplane_bindings.cc`) 为手写补绑 (生成器因重载+`std::array` 跳过), `boxCentered` 必须走它 — **不要**用 `rect+extrude(both=true)` 组合, `extrude(both=true)` 是 go-topo C++ 核心 bug (产出空 shape, Go 原生同现, 未修)
- workplane 17 个重几何方法 (fillet/chamfer/shell/extrude/loft/cutThruAll/cboreHole/cskHole/hole/twistExtrude/offset2d/revolve/sweep/cut/union/intersect/box) 绑定层已将 C++ 异常翻译为可读 JS Error
- **草图约束求解 (NLopt) 已补齐**: `Sketch.constrain(tag[, tag2], kind, value)` + `solve()` + `solve_status()` + `SketchConstraintKind` 枚举 (`src/sketch_bindings.cc`)。value 编组: number→double / `[a,b]`→double2 / `[t1,t2,d]`→double3 (null→none) / 省略→blank。求解后 DOF 在 `solve_status().x` (segment=[x1,y1,x2,y2], 三点弧=[cx,cy,r,a1,a2]), `status` 1-4 为 nlopt 成功码。测试: `test/cq_sketch_solver.test.ts` 33 例 (移植 go-topo `TestSketchSolver_*`, 含几何核验)
- **装配约束求解已补齐 (NLopt 后端)**: go-topo `solver.cc` 已从 Ipopt 整体切换为 NLopt LD_SLSQP (Ipopt 依赖移除; 顺带修复 Ipopt 时代被静默掩盖的 `to_pods()` entityIndices 恒空 bug — 此前装配 solve 从未真正生效)。绑定: `Assembly.constrain/constrain1/constrain2/constrain3` + `solve(verbosity?)` + `hasError()/getError()` + `AssemblyConstraintKind` 9 值枚举 (`src/assembly_bindings.cc`), param 编组 number/`[a,b]`/`[x,y,z]`/省略。测试: `test/cq_assembly_solve.test.ts` 9 例 (含位移拉回/定点移动几何核验, 与 go-topo `TestAssemblySolve_GeometricVerification` 同口径)
- **go-topo `safe_call` 粘性错误语义**: Go C API 把每个 workplane 调用包在 `safe_call` 里, 任一调用抛异常后 ctx 置错误标志, **后续所有调用短路 no-op**, 链冻结在抛出点前置状态 (go-topo 33 例中 7 处 golden 退化结果都源于此: 07/19/28/29/30/33)。Embind 绑定**不经** safe_call, 异常原样抛出 — TS 测试用 `Chain`/`safe` helper 显式复现该语义做 parity, 这不是 topo.js 的 bug, 但意味着**两套 API 的错误行为不同**: Go 静默退化, JS 抛异常
- 其他 go-topo cq 层语义偏差 (golden 已如实复现): `val()` = 栈首对象 (example_25 只含末次挤出, 不含基座), `Value()` 经 C API 类型切片体积不可得 (golden 仅 bbox 可对账), `shell(kind="")` 必抛 `Unknown join type` (go-topo 示例传 `""` 是移植错误, CadQuery 应为 `"arc"`), Embind 侧 `extrude` 的 `taper=0` 视为启用拔模 (传 `undefined` 才是无拔模, 与 C API 的 0→none 口径不同, shim `extrudeSimple` 已处理)

## go-topo 同步基线

当前同步至 go-topo `52aa12f28` (2026-09-08, 含审计修复轮: C++ 核心零签名变化, cgo C API 层大改与 WASM 无关) + 布尔修复 (纯实体 compound 递归拍平消除嵌套自干涉 UB、`Standard_Failure` 翻译为 `std::runtime_error`/`boost::none`, go-topo 侧见 `shape_ops.hh` `append_flattened`)。TS 层已与 Go 层对齐的防御: 锚段柱数 `Math.ceil(totalLen/spanLen)+1` (`CalcOcsSpanPositions`)、6 个铁路类 build 入口零值兜底 (`withDefaults`)、52 个铁路类 build 入口 NaN 拒绝 (`primitives_guard.go` 的 `hasNaN` 对应 `BasePrimitive.assertNoNaN`)。异常通道: 布尔家族 (Compound/ShapeOps 的 cut/fuse/intersect) 绑定层已将 C++ 异常翻译为可读 JS Error; 其余绑定面仍是裸指针数字 (Embind 不翻译 C++ 异常, 已确认该构建连 std::exception 也不翻译); 空 shape 调 `bbox()` 会抛异常 (预存在, Go 侧同样报错, 双侧一致)。

## 铁路覆盖现状

- **59 个 `create_*` 铁路函数**已绑定 (76+2 导出符号), 覆盖轨道/道岔/OCS 件/横跨装配 + 悬索三索型 (含 centerline 变体) + 枕木驱动道床
- **52 个铁路 Primitive 类**: `packages/topo-primitives/lib/railway/index.ts` (`RAILWAY/Xxx`, `createRLPrimitive` 分发)
- **2 个 TS layout 闭环**:
  - `lib/railway/anchor_section.ts` — `computeAnchorSectionLayout` / `createAnchorSectionFromLayout` / `anchorSectionLayout{To,From}JSON` (柱位/之字拉出值/弛度/吊弦公式, 子件 `mast_i`/`cw_i`/`mw_i`/`dropper_{span}_{idx}`)
  - `lib/railway/yard.ts` — `computeYardLayout` / `createYardFromLayout` / `yardLayout{To,From}JSON` (道岔开向号数识别/菱形交叉/边裁剪, 子件 `rails_i`/`sleepers_i`/`turnout_i`/`crossing_i`)
  - layout JSON schema 与 go-topo (`ocs_layout.go` / `yard_layout.go`) 互通
- topo-example GUI 仅接入铁路类型 1-16, 其余未接

## 已知坑

- **类型分发已修复但依赖全局注册**: workplane 绑定族曾用 `typeOf() == "workplane"/"solid"/"face"...` 做参数分发 — `typeOf()` 只返回 JS 原始类型, 类名检查全是死分支 (union/cut/mirror-by-vec/extrude-face/pushPoints-Location 等永远错路由)。2026-09 已全部改为 `instanceof` 并经 `emval_instanceof_global` 安全包装 (全局未注册时降级旧路径不抛错); 正确分发要求调用方注册全局类 — 库侧经 `ensureAssemblyGlobals` (`lib/railway/layout_utils.ts`, 覆盖 Workplane/Assembly/Location/Shape/Solid/Face/Compound/Sketch/gp_Vec/gp_Pnt/gp_Trsf/TopLoc_Location/gp_Pln) 兜底; 测试/脚本里直接用装配 API 时需先经库函数或手动调用
- **绑定缺口清单** (测试 skip 项, 未绑/不可用于 WASM):
  - 迭代器 `*Iterator.next()` (返回 `boost::optional<T>`): Edge/Wire/Vertex/Face/Shell/CompSolid/Compound — 遍历改用 `faces()/edges()/solids()` 等数组方法
  - Workplane: `get/getRange/getIndices/exportTo/addShapes`; Assembly: `get/setLocation/replace/parametric 系列`; Shape: `Share/WriteToStl`; Compound: `toSolid/inertia`; ShapeOps: `GetShapeOutline`; `createCableWireCenterline`
  - `Shape.exportStep` 在 WASM 写非 `/tmp/` 路径时仍失败 (emscripten MEMFS 限制, `/tmp/` 路径可用); `Shape1D.params(gp_Pnt[])` vector 编组缺口
  - `Edge.makeSpline` 已修复: 可选参数 tolerance/periodic 改为 `emscripten::val`, 缺省 `1e-6`/`false`
  - `Edge.makeEdgeFromCurve` 仍不接受 `Handle_Geom_TrimmedCurve`; 已补 `Edge.makeEdgeFromCurveTrimmed(trimmedCurve)` 包装函数
  - `makeSolidFromCylinderAngle(R,H)` 已修复: 缺省 angle=2π (完整圆柱), mass 正确
  - `gp_Cone_2(ax3,angle,radius)` 已修复, 可正常使用
  - `Shape.location()` 已修复: 返回 `topo_location` 对象 (含旋转), 可直接传回 `setLocation()`
  - `Quantity_Color.SetValues_2(r,g,b,type)` 可用; `Values()` 因 C++ output reference 参数 embind 无法编组, 用 `Red()/Green()/Blue()` 替代
  - 2D 类型族 (Point2/Dir2/XY/Vector2/独立 Trsf) 未暴露; `Quantity_Color` 用 `new tp.Quantity_Color_3(r,g,b,tp.Quantity_TOC_RGB)` 构造
- **`Assembly.getElements()` 已修复** — 原 `assembly_element` value_object 无法转 emval, 改为返回 plain JS object `{shape, name, location, color}`; 遍历装配仍推荐 `children()` / `name()` / `obj()` / `flatten()`
- `Assembly.create` / `add` 依赖全局注册, 库里经 `ensureAssemblyGlobals` (`lib/railway/layout_utils.ts`) 兜底; 测试/脚本里直接用装配 API 时需先经库函数或手动调用。同理 `Location` 构造器对 `gp_Trsf`/`TopLoc_Location`/`gp_Pnt`/`gp_Vec`/`gp_Pln`/`topo_vector` 做 instanceof, 用前也需注册同名全局 (参考 `test/cq_assembly_solve.test.ts` 的 beforeAll)
- `Assembly.create/add` 的 `loc` 参数走值类型编组 (`as<topo_location>()`), 传 `new tp.Location(...)` 构造的对象; `Location` 类是按值注册的, 不是 shared_ptr
- Embind `value_object` 字段必须全量初始化, 缺字段报 `Missing field: "xxx"`; enum 字段用 `tp.EnumType.VALUE` 赋值, 不要传裸数字
- **测试文件的全局类注册必须无条件覆盖** (`g[name] = tp[name]`): vitest 给每个测试文件独立的模块注册表, `helpers/topo.ts` 的单例在不同文件间可能是**不同的 WASM 实例**; `if (g.X === undefined)` 守卫会让先跑文件的类残留在全局, 后续文件的 embind 对象对它做 `instanceof` 必失败 ("Right-hand side of 'instanceof' is not an object" 或静默错路由)
- 不要在 `packages/topo-primitives` 跑裸 `tsc` (会把 `.js`/`.d.ts` 写进 `lib/` 源码目录), 构建用 `pnpm build` (rollup)
