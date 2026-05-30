# topo.js

浏览器端 3D 拓扑几何建模引擎 — [go-topo](https://github.com/flywave/go-topo) 的 WASM 移植。

基于 **OpenCASCADE** 技术，通过 **Emscripten** 编译为 WebAssembly，在浏览器中提供完整的参数化 CAD 建模能力。核心 API 设计受 [cadquery](https://github.com/CadQuery/cadquery) 启发，采用工作平面-草图-实体构建的工作流。

---

## 目录

- [架构](#架构)
- [包说明](#包说明)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [项目命令](#项目命令)
- [WASM 构建](#wasm-构建)
- [TypeScript 接口修复](#typescript-接口修复)
- [开发工作流](#开发工作流)
- [示例代码](#示例代码)
- [参考](#参考)

---

## 架构

```
go-topo/                          # C++ 几何内核
├── src/
│   ├── primitives_railway.cc     # 铁路/接触网/轨道图元 (30+ 类型)
│   ├── shape_ops.cc              # 布尔运算、扫掠、放样、中心线拟合
│   ├── workplane.cc              # 工作平面系统
│   ├── sketch.cc                 # 草图求解器 (nlopt)
│   ├── assembly.cc               # 装配约束求解器
│   └── ...                       # 200+ 源文件

topo.js/                          # WASM 绑定 + JS SDK
│
├── gen/                          # Go 构建系统
│   ├── cmd/main.go               # CLI: build-ogg / build-topo / run / gen-ts
│   ├── build.go                  # 构建编排 + TypeScript 定义生成
│   ├── binding.go                # Clang AST → Embind C++ 绑定生成
│   ├── generate.go               # Clang 解析 + 遍历 + 绑定生成管道
│   ├── compile*.go               # 并行编译 (OCCT / go-topo / bindings)
│   ├── worker.go                 # 共享工作池
│   ├── filter/                   # 文件/类/方法过滤 (黑名单机制)
│   └── patches/wasm.patch        # WASM 兼容性补丁
│
├── src/                          # Embind C++ 绑定代码
│   ├── topo_bindings.cc          # Shape / Edge / Face / Wire / Solid 等
│   ├── primitives_bindings.cc    # 参数化图元绑定 (100+ 类型)
│   ├── geometry_bindings.cc      # 几何创建器 (曲线/曲面)
│   ├── assembly_bindings.cc      # 装配绑定
│   ├── sketch_bindings.cc        # 草图绑定
│   ├── workplane_bindings.cc     # 工作平面绑定
│   └── *.d.ts                    # 手写 TypeScript 声明
│
├── packages/
│   ├── topo-wasm/                # WASM 产物包
│   │   ├── topo.full.wasm        # 编译后的 WebAssembly (62MB)
│   │   ├── topo.full.js          # Emscripten 胶水代码
│   │   └── topo.full.d.ts        # 全量 TypeScript 声明 (20万行)
│   │
│   ├── topo-threejs/             # Three.js 渲染辅助
│   │   └── lib/threejs-helper.ts # 网格数据 → Three.js BufferGeometry
│   │
│   ├── topo-primitives/          # 参数化图元封装
│   │   └── lib/
│   │       ├── primitive.ts      # 基类 BasePrimitive
│   │       ├── base/             # 基础图元 (盒/柱/锥/环)
│   │       ├── geology/          # 地质/基础图元 (桩/锚杆/承台)
│   │       ├── gim/              # 输电线路图元 (塔/绝缘子/金具)
│   │       └── types/            # 参数类型定义
│   │
│   ├── topo-js/                  # 主 JS SDK
│   │   └── src/
│   │       ├── topolib.ts        # 核心入口: Workplane / Sketch 封装
│   │       ├── shapes.ts         # 形状操作
│   │       ├── geom.ts           # 几何工具
│   │       ├── mesh.ts           # 网格生成
│   │       ├── curves.ts         # 曲线操作
│   │       ├── projection/       # 投影系统
│   │       └── lib2d/            # 2D 几何库
│   │
│   └── topo-example/             # Three.js 示例应用
│       └── src/
│           ├── index.ts          # 入口
│           ├── world.ts          # 3D 场景
│           └── primitives.ts     # 图元演示
│
├── Makefile                      # WASM 构建自动化
├── patch.sh                      # WASM 补丁生成脚本
└── tsconfig.json                 # TypeScript 配置
```

---

## 包说明

### topo-wasm (`packages/topo-wasm`)

WASM 底层绑定包。由 `make rebuild` 生成，包含编译好的 WebAssembly 二进制和 TypeScript 声明。一般不需要直接使用，而是通过 `topo-js` 调用。

### topo-threejs (`packages/topo-threejs`)

Three.js 渲染辅助包。提供 `meshToGeometry` 等函数将 WASM 输出的网格数据转换为 Three.js `BufferGeometry`，支持顶点/法线/UV/三角面/面分组。

### topo-primitives (`packages/topo-primitives`)

参数化图元封装层。将底层 C++ 函数包装为 TypeScript 类，统一了 `setParams` / `build` / `toObject` 等接口。覆盖以下领域：

| 分类 | 图元 |
|------|------|
| **基础** | 盒/球/椭球/柱/锥/偏心锥/环/矩形环/椭圆环 |
| **钢结构** | 角钢/工字钢/槽钢/T 型钢 |
| **基础** | 钻孔桩/承台/锚杆/阶梯基础/筏板/沉井/嵌岩 |
| **输电线路** | 杆塔/角钢塔/绝缘子/悬垂串/耐张串/导线 |
| **电缆** | 电缆/接头/终端/支架/桥架/排管/沟道/隧道 |
| **管道** | 直管/弯管/多段管/三通/接头/法兰 |
| **铁路** | 接触线/承力索/吊弦/钢轨/尖轨/扣件/腕臂 |
| **井** | 转角井/三通井/四通井/竖井/人孔 |

### topo-js (`packages/topo-js`)

主 SDK 包。提供高层次的建模 API，核心入口 `topolib.ts` 封装了：

- **Workplane**: 工作平面系统，支持链式调用构建 3D 模型
- **Sketch**: 二维草图，支持线段/圆弧/样条/约束求解
- **Shape**: 形状操作：平移/旋转/镜像/缩放/布尔运算
- **Assembly**: 装配体，支持多层级零部件管理
- **Selector**: 几何选择器：类型/方向/距离/Nth 等

### topo-example (`packages/topo-example`)

基于 Three.js 的示例应用。展示 `Workplane` 建模流程，包含 30+ 示例场景。

---

## 环境要求

### WASM 构建（仅修改 C++ 绑定时需要）

- **Emscripten** 4.0+ (`emcc`)
- **Go** 1.21+
- **LLVM 15** (clang + libclang)
- **OCCT** 源码 (在 `external/ogg/` 中)

### JS SDK 开发（日常开发）

- **Node.js** 18+
- **pnpm** 9+

---

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 构建 JS SDK (topo-threejs → topo-primitives → topo-js)
pnpm build:js

# 3. 构建示例
pnpm build:example

# 4. 启动开发服务器
pnpm dev
```

打开 http://localhost:4001 查看示例。

首次运行无需 WASM 构建，`packages/topo-wasm/src/` 中已包含预编译的 WASM 产物。仅当需要修改 C++ 绑定代码或更新 go-topo 内核时才需要执行 WASM 构建。

---

## 项目命令

### 根目录

| 命令 | 功能 |
|------|------|
| `pnpm dev` | 启动开发服务器 → localhost:4001 |
| `pnpm start` | 同上 |
| `pnpm build:js` | 依次编译 threejs → primitives → js |
| `pnpm build:example` | 编译示例应用 (webpack) |
| `pnpm build` | 完整 WASM 构建 (make) |
| `pnpm rebuild` | 快速重编 WASM (跳过 OCCT) |
| `pnpm wasm` | 快速重编 WASM |

### Makefile

| 命令 | 功能 |
|------|------|
| `make` | 完整构建 (OCCT + go-topo + bindings + 链接) |
| `make rebuild` | 快速重编 (跳过 OCCT) |
| `make multi` | 多线程完整构建 |
| `make tool` | 只构建 gen 工具 |
| `make ogg` | 只编译 OCCT 库 |
| `make topo` | 只编译 go-topo 源码 |
| `make topo-bindings` | 编译绑定源码 |
| `make bindings` | 编译自定义绑定 (OCCT 类绑定) |
| `make run` | 链接 WASM |
| `make gen-ts` | 重新生成 TypeScript 声明 |
| `make clean` | 清理所有构建产物 |

---

## WASM 构建

WASM 构建系统位于 `gen/` 目录，是一个 Go 语言编写的构建工具链。

### 构建流程

```
                  gen/topo.full.yml (配置)
                         │
               topo generate (Clang AST解析)
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
  build-ogg           build-topo       build-topo-bindings
  (OCCT C++)         (go-topo C++)    (绑定 C++)
      │                  │                  │
      └──────────────────┼──────────────────┘
                         ▼
                   run (emcc 链接)
                         │
                    topo.full.{js,wasm}
                         │
                   gen-ts (TypeScript 生成)
                         │
                   topo.full.d.ts
```

### 构建系统关键组件

| 组件 | 文件 | 说明 |
|------|------|------|
| CLI | `gen/cmd/main.go` | Cobra CLI，子命令对应构建步骤 |
| 配置 | `gen/topo.full.yml` | emcc 标志、内存设置、导出选项 |
| 绑定生成 | `gen/binding.go` | 通过 libclang 解析 C++ 头文件，自动生成 embind 绑定代码 |
| 文件过滤 | `gen/filter/` | 黑名单机制，排除不支持的类型/方法/包 |
| WASM 工具 | `gen/wasm/common.go` | 纯虚方法检测、重载后缀、typedef 去重 |
| 补丁管理 | `gen/patches/wasm.patch` | WASM 兼容性补丁 (替换 `using` 声明为包装器方法) |

### OCCT 类绑定

绑定系统通过 libclang 解析 OCCT 头文件，自动生成 `EMSCRIPTEN_BINDINGS(...)` 代码。`filter/` 目录维护了约 500 条过滤规则，排除：

- **可视化模块**: AIS / V3d / OpenGl (浏览器中不需要)
- **Draw 模块**: 测试/调试命令
- **平台相关**: Cocoa / WNT
- **有问题的类型**: 模板特化、位域、流操作符

### 补丁管理

`patch.sh` 用于生成 WASM 兼容性补丁，对比 go-topo 原始 OCCT 与本项目的修改版本：

```bash
# 生成补丁
bash patch.sh

# 应用补丁 (由构建系统自动执行)
patch -p0 < gen/patches/wasm.patch
```

补丁解决的主要问题：
- 替换 `using Base::method;` 声明为显式包装器方法 (embind 不支持 `using`)
- 修复指针/引用返回类型
- 添加缺失的 `IsEqual` 方法

### 增量编译

构建系统支持增量编译，只重新编译修改过的源文件：

```bash
# 修改了 topo_bindings.cc 后，只需重新编译这一个文件并链接
make topo-bindings run
```

---

## TypeScript 接口修复

`topo.full.d.ts` 由两部分合并而成：

1. **自动生成部分** (clang 解析 OCCT 头文件) — 约 20 万行
2. **手写部分** (`src/*.d.ts`) — 约 5000 行手写声明

### 已知差异 (绑定 vs TypeScript 声明)

手写声明中的常见问题：

| 问题 | 说明 | 修复方法 |
|------|------|---------|
| 拼写错误 | `startgPoint` → `startPoint` | 已修复 |
| 类型错误 | `boundingBox()` 返回 `Bnd_Box` → `BBox` | 已修复 |
| 参数缺失 | `bbox()` 缺少 `tolerance?` 参数 | 已修复 |
| 幽灵方法 | C++ 中未绑定的方法在 `.d.ts` 中声明 | 已清理 (geometry.d.ts) |
| 缺少导出 | `Assembly` / `Sketch` / `Workplane` 类缺少 `export` | 已修复 |
| 参数签名错误 | `makeArcOfCircleWithVector` 参数不匹配 | 已修复 |
| 行连接错误 | `};export` 缺少换行 | 已修复 |

---

## 开发工作流

### 修改 JS SDK 代码

```bash
pnpm build:js       # 重新编译 JS 包
pnpm dev            # 启动 dev server 查看效果
```

### 修改 C++ 绑定代码

```bash
# 修改 src/topo_bindings.cc 等文件后:
make topo-bindings  # 只编译修改过的绑定
make run            # 重新链接 WASM
pnpm dev            # 验证
```

### 更新 go-topo 内核

```bash
# go-topo 侧: 修改 C++ 源码并提交
# 本项目侧: 自动读取 ../go-topo/src/

make topo           # 增量编译 go-topo 源码 (自动检测修改)
make run            # 重新链接
```

### 添加新绑定

1. 在 `src/*_bindings.cc` 中添加 `EMSCRIPTEN_BINDINGS(...)` 代码
2. 在 `src/*.d.ts` 中添加对应的 TypeScript 声明
3. 在 `src/*.export.json` 中注册导出
4. `make rebuild` 重新编译并链接

---

## 示例代码

### 基础立方体

```typescript
import init, { Workplane } from 'topo-wasm';

const topo = await init();
const wp = new topo.Workplane('XY');
const box = wp.box(10, 10, 10).val();
```

### 工作平面链式调用

```typescript
const result = new topo.Workplane('XY')
  .box(10, 10, 10)
  .faces('>Z')
  .hole(2, 5)
  .val();
```

### 草图 + 拉伸

```typescript
const sk = new topo.Workplane('XY')
  .rect(10, 10)
  .extrude(5)
  .val();
```

### 网格导出

```typescript
const mesh = shape.mesh(0.1, 0.5, 0.3);
// mesh.vertices — 顶点数组
// mesh.normals  — 法线数组
// mesh.triangles — 三角面索引
// mesh.faceGroups — 面分组信息
```

---

## 参考

- [go-topo](https://github.com/flywave/go-topo) — Go 拓扑几何建模库 (C++ 内核 + Go 封装)
- [OpenCASCADE Technology](https://dev.opencascade.org/) — 3D CAD 内核库
- [Emscripten](https://emscripten.org/) — C/C++ → WebAssembly 编译器
- [Three.js](https://threejs.org/) — 3D 渲染引擎
- [CadQuery](https://github.com/CadQuery/cadquery) — 参数化 CAD 建模框架 (API 设计参考)
