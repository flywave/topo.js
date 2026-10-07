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


## 6. Parity 棘轮现状 (2026-10-07, 迭代 7 后)

- **棘轮全表 (10/10 全绿，零 skipped，最大 gap 0.18%)**：

  | 树 | gap | 备注 |
  |---|---|---|
  | boolean_union_boss | 0.00% ✓ | |
  | boolean_cut_plate | 0.00% ✓ | 迭代 7 前为 95.19% |
  | twin_bores | 0.05% ✓ | |
  | tube_revolve | 0.11% ✓ | revolveSimple |
  | twin_pads | 0.00% ✓ | 迭代 7 前为 64.58% |
  | pattern_polar_plate | 0.04% ✓ | 迭代 7 前为 1.62% + skipped |
  | plate_bore_fillet | 0.01% ✓ | 迭代 7 前为 33.32% |
  | mirror_pair | 0.09% ✓ | |
  | pattern_linear_bore | 0.13% ✓ | |
  | shell_tray | 0.18% ✓ | 迭代 7 前为 46.93% + skipped |

- **迭代 7 根因复盘（重要）**：§6 前版记录的"剩余四类缺口"
  （boolean cut 分歧 / 双组件拆环 / fillet 选择器语义 / shell 失败）
  **全部是同一个根因的不同症状**：解释器剖面构建走了 workplane 的
  `polyline+close` 路径，而 go-topo C++ 的 pending-edge → wire → face
  管线对**偏离原点的矩形**确定性产出腐坏实体（错误体积、负质量、mesh
  延伸到原点；探针复现：16×16×5 矩形在 cx=30 得 1280 ✓、cx=−30 得
  853.3 ✗、cx=100 得 2400 ✗）。既往 6/10 达标的语料恰好都是含原点的
  剖面，所以掩盖了它。
- **修复**：剖面构建迁移到 **Sketch API 路径**
  （`plane.sketch() → segmentBetweenPoints → assemble(ADD) → finalize →
  extrude`），与 Go 侧 `topo.Sketch` 配方逐字对齐；shim 层封装为
  `sketchLoop(vertices)` 并注明禁用 polyline 路径的原因。探针实测该路径
  在所有位置精确（1280/2560/双实体数全对）。
- 次要修复：`pattern_polar` 的 rotate 返回 Workplane 需取 `vals()[0]` 再
  转 Compound（`toCompoundOf` 兜底改用 `Compound.makeCompound`，并修掉
  其闭包误引用 ctx 的潜在 ReferenceError）。
- **方法论沉淀**：内核层的"几何分歧"先做位置敏感性探针再下结论——
  同一配方在不同坐标下结果不同 ⇒ 内核路径腐坏，而不是选择器/语义差异。
- 内核绑定增量（text/chamferAngle/拓扑邻接查询）已在工作树编译进 wasm，
  其 WIP 探针 (corpus_replay/topology_query) 缺 fixture 仍红，随绑定一起
  后续收口。
- parity 测试保持 env-gated (`CADGEN_EDITOR_KERNEL=1 CADGEN_GOLDENS=…`)，
  不进默认 CI；**全绿后建议移入默认门禁**（棘轮不再允许回退）。
