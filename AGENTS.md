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

## 测试

```sh
pnpm --filter topo-primitives test        # vitest run, 全量
pnpm --filter topo-primitives test:watch  # watch 模式
```

- 宿主包: `packages/topo-primitives` (vitest 0.28, 与 topo-js 一致; 配置 `vitest.config.ts`: node 环境, `threads: false` 单线程, `testTimeout` 180s — 重几何用例如道岔/站场再生成单文件可达数分钟)
- `test/helpers/topo.ts` — WASM 加载模块级单例: ES6 import `topo.full.js` + `readFileSync` wasm + `{ wasmBinary }`, 每个测试文件初始化一次
- `test/railway_primitives.test.ts` — 52 个铁路 Primitive 类冒烟 (`setDefault` → `build` → shape 非空 / bbox 有限)
- `test/railway_layout.test.ts` — 锚段/站场布局闭环 (计算口径 / JSON 往返 / 命名唯一 / 编辑再生成 bbox / 与 Go layout JSON 互通)

## 铁路覆盖现状

- **58 个 `create_*` 铁路函数**已绑定 (75+2 导出符号), 覆盖轨道/道岔/OCS 件/横跨装配 + 悬索三索型 + 枕木驱动道床
- **52 个铁路 Primitive 类**: `packages/topo-primitives/lib/railway/index.ts` (`RAILWAY/Xxx`, `createRLPrimitive` 分发)
- **2 个 TS layout 闭环**:
  - `lib/railway/anchor_section.ts` — `computeAnchorSectionLayout` / `createAnchorSectionFromLayout` / `anchorSectionLayout{To,From}JSON` (柱位/之字拉出值/弛度/吊弦公式, 子件 `mast_i`/`cw_i`/`mw_i`/`dropper_{span}_{idx}`)
  - `lib/railway/yard.ts` — `computeYardLayout` / `createYardFromLayout` / `yardLayout{To,From}JSON` (道岔开向号数识别/菱形交叉/边裁剪, 子件 `rails_i`/`sleepers_i`/`turnout_i`/`crossing_i`)
  - layout JSON schema 与 go-topo (`ocs_layout.go` / `yard_layout.go`) 互通
- topo-example GUI 仅接入铁路类型 1-16, 其余未接

## 已知坑

- **`Assembly.getElements()` 绑定有 bug** (assembly_element 无法转 emval) — 遍历装配用 `children()` / `name()` / `obj()` / `flatten()`
- `Assembly.create` / `add` 依赖全局注册, 库里经 `ensureAssemblyGlobals` (`lib/railway/layout_utils.ts`) 兜底; 测试/脚本里直接用装配 API 时需先经库函数或手动调用
- Embind `value_object` 字段必须全量初始化, 缺字段报 `Missing field: "xxx"`; enum 字段用 `tp.EnumType.VALUE` 赋值, 不要传裸数字
- 不要在 `packages/topo-primitives` 跑裸 `tsc` (会把 `.js`/`.d.ts` 写进 `lib/` 源码目录), 构建用 `pnpm build` (rollup)
