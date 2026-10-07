# topo-cadgen-editor — 编辑器框架 (P3 迭代 4)

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
- **当前已知缺口 (环境棘轮已红)**：boolean 族在 Embind 层的工具入参绑定
  异常 —— Workplane.cut 拒收 Workplane 工具 (要求 Compound)，而
  tp.Compound 的 Embind 构造重载同样失配 ("invalid number of parameters")。
  这与 go-topo 侧 Workplane.Cut(Workplane) 可用的行为不一致，属内核 Embind
  绑定缺口 (与 AGENTS"已知坑"同类)。绕行路径：boolean 工具以
  shape-to-Compound 的正确构造方式接入 (待查 Embind 正确 ctor)，或 kernel
  侧补 cut(Workplane) 绑定 —— 与 phase2 §3.3 的内核绑定增量同批处理。
- parity 测试保持 env-gated (`CADGEN_EDITOR_KERNEL=1 CADGEN_GOLDENS=…`)，
  不进默认 CI；缺口闭合后移入默认门禁。
