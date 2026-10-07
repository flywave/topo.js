# topo-cadgen — 编辑器框架 (P3)

go-cadgen 前端编辑器的**框架**：以 FeatureTree 为交互对象，浏览器内 topo.js
内核本地翻译生成几何（预览），go-cadgen 服务端是**验证权威**（门禁/版本/
verdict 只在服务端重放时产生）。本包不打补丁式实现，而是为拓展打地基。

## 1. 分层

```
┌─────────────────────────────────────────────────┐
│ features/   面板与流程 (editChat/versions/…)      │  ← 每个功能一个模块
├─────────────────────────────────────────────────┤
│ viewer/     three.js 视口 (面网格/拾取/高亮/工具)   │
├─────────────────────────────────────────────────┤
│ core/       store · commands · selection ·        │
│             artifacts · digest · transport        │
├─────────────────────────────────────────────────┤
│ engine/     内核宿主 + 树解释器 (op 注册表)          │
│             ↕ CQ shim → topo-wasm Embind          │
└─────────────────────────────────────────────────┘
        ↕ HTTP (api.md 契约)
   go-cadgen server (验证权威: 门禁/版本/verdict/LLM)
```

- **core** 不 import three.js，不碰 DOM —— 纯状态与语义，全部可单测。
- **viewer** 只认识 MeshData 与面索引；归属/高亮通过 core 的订阅表达。
- **features** 是用户可见功能的装配，彼此不互相 import。

## 2. 拓展点（加功能不改核心）

| 拓展什么 | 怎么加 | 例子 |
|---|---|---|
| 新的树操作 | `interpreter.registerOp("op", handler)` | shell/loft 逐步补齐；每个 op 配一条语料 parity |
| 新的面板 | `app.registerPanel({id, el, mount})` | 参数表、装配树、导出按钮 |
| 新的视口工具 | `commands.register({id, run})` + 键位 | 剖面、测量、爆炸 |
| 新的后端能力 | `transport` 加一个资源方法 | feedback、多文件运行 |
| 新的编辑语义 | core/artifacts + selection 的解析策略 | 多文件运行、装配引用 |

## 3. 数据流（闭环）

```
用户点面 → selection.resolve(faceId) ──→ artifacts (本地前缀构建归属)
        → 编辑提示词 + 选中证据
        → transport.postSession({prompt, runId, selectedFeatureIDs})
        → SSE 事件流 (reasoning/run_replay/done) → store
        → 服务端已自动落版 → transport 刷新 tree/mesh/versions → viewer 重绘
```

本地构建 = **预览**；服务端重放 = **合格证**。两侧一致性由语料 parity 钉死
（`test/parity.test.ts` 跑 go-cadgen/testdata/corpus/trees 的同一批 goldens，
体积/包盒 1.5% 容差）—— 漂移即红，有争议以 Go interp 为准。

## 4. 纪律（与 roadmap/phase3 一致）

1. 验证权威在服务端；本地几何是预览，不下沉门禁。
2. 双引擎漂移由语料 goldens 锁死；op 覆盖率以 parity 为棘轮逐步推。
3. 内核 wasm (~66MB) 只在编辑器加载，`kernel.ts` 单例懒加载。
4. 表达式求值/树 coerce 从归档提交 b8b0c4fe 回捞，与 Go 语义对齐。

## 5. 与 go-cadgen 的关系

- 服务端 `ServeEditor(dir)` 指向本包 `dist/`（`cmd/cadgen-serve -web`）。
- go-cadgen/web/ 保留为无内核的薄客户端兜底（mesh 兜底显示）。
- 交互协议 = api.md；本包是它的第一个"厚"消费者。


## 6. Parity 棘轮现状 (2026-10-07)

- 内核加载/解释器骨架/pad/pocket/fillet/chamfer/extrudeSimple 已通：
  plate_bore_fillet/tube_revolve/twin_pads 等 pad+凹槽家族的语料 parity 达标
  (1.5% 容差)。
- **棘轮全表 (2026-10-07, castCompound 路线)**：

  | 树 | gap | 备注 |
  |---|---|---|
  | boolean_union_boss | 0.00% ✓ | 联动全通 |
  | boolean_cut_plate | 95.19% ✗ | pad+cut 全 emit；cut 后体积分歧 1166.7 (确定性复现，所有工具形态同值) |
  | twin_bores | 0.05% ✓ | 双圆孔 pocket 精确 |
  | tube_revolve | 0.11% ✓ | revolveSimple |
  | twin_pads | 64.58% ✗ | 双组件剖面拆分 (splitLoops) 产出错误环 |
  | pattern_polar_plate | 1.62% ⚠️ | 孔位近似达标 (3 孔)，略超容差 |
  | plate_bore_fillet | 33.32% ✗ | fillet 选择器语义 (TS shim "|Z" 面集与 Go 不同) |
  | mirror_pair | 0.09% ✓ | mirroredFromAxis2/Workplane mirror |
  | pattern_linear_bore | 0.13% ✓ | Shape.translated 链 |
  | shell_tray | 46.93% ✗ | 内核 shell 直接失败 (shelling operation failed) |

  已修：circleCentered 圆孔路径、castCompound 布尔工具、revolve op 注册、
  installGlobals 全量类注册（修 "instanceof is not an object" 族）。
  **重要澄清**：解释器必须搭配 CQ shim 表面使用（编辑器 app.ts 与 parity
  测试的 cq 工厂都是 shim 实例）—— shim 在裸 Embind Workplane 之上补了
  extrudeSimple/circleCentered 等方法；裸表面缺这些方法属预期，不是缺陷。
  **剩余四类缺口**（经 shim 表面实测）：
  1. boolean cut 分歧（95.19%，全工具形态确定性复现，Go=24250/TS=1166.7）
  2. 双组件剖面拆环（twin_pads 64.58%，splitLoops 拆出的环 extrude 后体积不符）
  3. plate_bore_fillet 33.32%（fillet 选择器 "|Z" 两侧语义差异）
  4. shell_tray 46.93%（内核 shelling operation failed）
  逐项迭代即是后续 op 覆盖工作本身 —— 棘轮表格就是它们的工作清单。- parity 测试保持 env-gated (`CADGEN_EDITOR_KERNEL=1 CADGEN_GOLDENS=…`)，
  不进默认 CI；缺口闭合后移入默认门禁。
