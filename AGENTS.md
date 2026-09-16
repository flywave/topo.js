# topo.js

go-topo (OpenCASCADE C++ 几何内核) 的 WASM 移植: Emscripten 编译 + Embind 绑定 + TS SDK。pnpm + lerna monorepo。

## 项目结构

- `gen/` — Go 构建工具链 (Clang AST → Embind 绑定生成 → emcc 并行编译 → 链接 → TS 声明生成)
- `src/` — Embind C++ 绑定 (`topo_bindings.cc` / `primitives_bindings.cc` / ...) + 手写 `.d.ts`
- `packages/topo-wasm/` — WASM 产物包 (`src/topo.full.{js,wasm,d.ts}`, 已预编译入库)
- `packages/topo-primitives/` — 参数化 Primitive 类 (`lib/`, 含 `lib/railway/` 52 个铁路类 + 布局闭环)
- `packages/topo-threejs/` / `packages/topo-js/` — Three.js 桥接 / 高层 API
- `packages/topo-example/` — 示例应用 (webpack)
- `packages/topo-img2cad/` — 图片 → 参数化 CAD 流水线: 视图识别 → 轮廓提取 → 特征树 → 代码 → **实测复核** (L4 把 BREP 实体沿图纸视图重投影, 与图纸像素剪影比 IoU/像素偏差; L4b 在图纸取不出剪影时改比"模型轮廓到图纸墨迹的距离") → 导出 STEP + 二进制 STL。`lib/` 为库, `cli/` 为 `topo-img2cad` 命令 (见 `SKILL.md`)。**注意**: ① `bin` 指向 `dist/es/cli/index.js`, 由 rollup 构建 (不是从源码跑), 改 CLI 后必须 `pnpm --filter topo-img2cad build`; ② 依赖 Node (`node:zlib` 解 PNG、`node:fs` 读图), 只支持 PNG/PNM 非隔行, 不支持 JPEG; ③ `CadPipelineConfig.references` 一般不用传 — 有 `tp` 时参考剪影直接自图纸读出; ④ **导出必须走 `lib/export.ts`** — 内核的 `exportStep`/`writeToStl` 写的是 Emscripten 内存 FS, 直接给宿主路径**不产生文件却返回 `true`** (AGENTS"已知坑"里那条的根因), 所以统一写 `/tmp` 再 `tp.FS.readFile` 读回
- `packages/topo-editor/` — 可视化编辑器 (webpack + CodeMirror 6 + three.js 视口): 左侧写 JS 右侧实时渲染, 用于所见即所得验证 topo.js 接口。`pnpm --filter topo-editor dev` → http://localhost:4002 (沙箱注入 `tp`/`CQ`/`CQWorkplane`/`pnt`/`vec`/`gpVec`/`render()`, 内置 10 个与测试套件对齐的示例 snippet)。**注意**: 它经 workspace 包名引用 topo-primitives/topo-js/topo-threejs 的 **dist 构建产物**, 改了这些包的 `lib/`/`src/` 后必须先 `pnpm --filter <pkg> build` 重建 dist, 否则编辑器拿到的是旧代码 (如 CQ 导出缺失报 `CQ is not defined`)

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

**链接步骤的 metadce 偶发损坏 wasm**: `make rebuild` 的 `emcc -O3` 内含 `wasm-metadce`, 它以 `-o` **原地**改写 `packages/topo-wasm/src/topo.full.wasm`。偶发 `[parse exception: Section extends beyond end of input]` 会让该文件被截断 (曾见 66.1MB → 64.2MB), 而 `make` 只是报 `run` 失败 —— 产物已被破坏但仓库看着还在。处理: `git checkout -- packages/topo-wasm/src/topo.full.wasm` 还原后重跑, 重跑即成功 (同参数此前已成功多次, 属偶发而非代码问题)。注意 `make ... | tail` 会把退出码换成 `tail` 的, 别用管道判断成败。

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
  - **golden 再生成流程** (go-topo 几何变更后必须走, 不要手改数字): ① go-topo `cmake --build build --target topo` + `cp build/src/libtopo.a libs/darwin_arm/` (**只构建 topo 目标**, 全量 build 会连带重编 external/icu) ② `GOLDEN_DUMP=/tmp/g.json CC=/usr/bin/clang CXX=/usr/bin/clang++ go test -run Test_example -count=1 .` (dump 机制见 go-topo `goldens_dump_test.go`, 例子里 35 处 `recordGolden` 由 `GOLDEN_DUMP` 环境变量启用, 不设置时零副作用) ③ 用新 JSON 覆盖对应条目 ④ `make rebuild` 重建 WASM ⑤ 跑 `cq_examples` 对账
  - **坑: 不要用导出的 `.step` 反推 golden**。STEP 往返对镜像/偏移/多实体示例不等价 (曾实测 11/16/23 三例偏差达 5 倍), 口径必须是内存中 `Value()` 的 bbox
  - **golden 是"当前 go-topo 的输出"快照, 不是独立预言机**: 修 go-topo 几何 bug 后 golden 会合法漂移, 此时按上面流程重生成; 关键判据是 Go 与 WASM 在新 golden 下同时通过 (两侧共用同一份 C++, 修好后应逐位一致, 曾实测 ex_29 xMin 双侧 `-50.82392200292494` 完全相等)
  - **改 golden 前后都要问「新值是否比旧值更对」**: 本轮两次重生成各有一条独立佐证 (ex_29 先由 x/y 零展布的退化直线变成实体; 后续绕向修复又把它从 z `-48..51` 拉回构造本身蕴含的 `0..51`)。仅「两侧一致」不足以证明正确性 —— 一致只证明 parity。
- 绑定层全量覆盖 (移植 go-topo 同名 Go 测试, parity 断言; skip 项 = 绑定缺口, 见"已知坑"的缺口清单):
  - `test/shapes_edge_wire.test.ts` / `shapes_face_solid.test.ts` / `shapes_compound.test.ts` — 核心形状族 (Edge/Wire/Vertex/Face/Solid/Shell/CompSolid/Compound/Shape)
  - `test/shape_ops_selector.test.ts` — ShapeOps + Selector
  - `test/geometry_mesh_standard.test.ts` — GeometryCreator/gp 几何类型/mesh/standard
  - `test/workplane_full.test.ts` / `sketch_ops.test.ts` / `assembly_full.test.ts` — Workplane/Sketch/Assembly 全方法
  - `test/primitives_{foundation,gasket_anchor,cable_stretch,plate_steel_infra}.test.ts` — 非铁路 create_* 族 (约 300 例, value_object 参数全字段初始化 + enum 传枚举对象)

### topo-img2cad

宿主包 `packages/topo-img2cad` (vitest 0.28, 24 文件 369 例, 约 10s): `pnpm --filter topo-img2cad test`。

- `test/image.test.ts` — PNG/PNM 解码 (全色型/位深/滤镜) + 剪影提取; 含 `docs/media/img1.png` 真图逐像素对账 (口径已与 ImageMagick 交叉核对)
- `test/reference.test.ts` — 图纸 → 参考剪影 (line art 走 region 模式, 内孔必须是孔; 填充件走 ink 模式) + 工件持久化往返
- `test/cad_loop_e2e.test.ts` — **闭环总测**: 程序生成图纸 PNG → 真 WASM 建实体 → 与图纸剪影比 IoU (实测 0.966), 并验证错尺寸图纸必须失败、无比例尺时降级为形状比较; 含**标注密集图纸**两例 (尺寸层铺满整张图 ⇒ 无单一闭合区域 ⇒ `maskUsable: false`, 只有 L4b 在跑): ① 正确件通过、半尺寸件由 `EDG_OUTLINE_MISMATCH` 否掉; ② **修复环闭环** —— 50→70→100 三轮, 断言 `refinements === 2`: 第一轮(50→70)阻塞问题数不变, 只可能靠 L4b 的度量被采纳, 若该度量在有剪影缺失的图上为空则这一轮会被拒、环停在错件上; 同时断言交回模型的提示语里带 `outline`/`chancePx`/`atExtent`
- `lib/cad/chamfer.ts` + `test/profile_to_ink.test.ts` — **距离场采样 + 摆放搜索** (从 `edge_distance.ts` 提出, 两条形状门共用一份, 两个判词才可比) 与**剖面-墨迹测量** 6 例: 正件≈0、点名不follow墨迹的实体、**永远 warning 不 error**、无比例尺时降级为 normalized 并说明、空剖面、忽略 construction 几何
- `test/scale_fit.test.ts` — 尺寸拟合 (`lib/cad/scale_fit.ts`): 按总高 150/187.957 缩到 0.798、已一致则不动、**忽略量的是特征而非零件的尺寸**、比值 2 的"另一个量"拒绝、两尺寸矛盾时拒绝并报数字、表达式尺寸按参数解析、全树共用一个比例、以及无尺寸的 sketch 不予置评
- `test/edge_distance.test.ts` — **L4b 轮廓-墨迹距离门** (`lib/validators/edge_distance.ts`): 正件 mean≈0 通过、放大/缩小件失败、标注线不干扰、无墨迹报 warning 而非放行、`EDG_BAD_VIEW` 不抛异常; 搜索: 比例尺估错 20% 仍须通过、错形状搜索也救不回来、搜索窗有上限 (每轴 ≤ 帧短边 25%)
- 其余为既有单测 (`expr`/`profile`/`reconcile`/`projection`/`feature_tree`/`cad_pipeline`/`wasm_e2e`)
- `test/mirror.test.ts` — `mirror` 带 `ofFeature` 时**必须镜像该特征的工具体**。此前发射器完全忽略 `ofFeature` 一律镜像整个 body, 实测把 120×80×10 的板镜像成 **20 厚、体积翻倍**且无人察觉 (剪影沿草图法线取, 对厚度天然失明; 单视图也没有第二个视图可对账)。**镜像可以链式复合** —— 绑定 `mirror(plane, base, copy=true)` 保留原体, 返回"工具 ∪ 其反射", 故对 YZ 再对 XY 两次即得四角孔 (实测体积与解析值一致)。**唯一被拒的情形**: 镜像面正是该特征自己的草图面 —— 反射与原体重合, 内核 fuse 两枚重合工具直接崩 "null function or function signature mismatch"**且**这本来就是无操作。真实那次正是踩这个: 板画在 XZ, 模型却用 XZ 去"沿高度镜像"(沿高度其实要 XY), 于是既无操作又崩。发射器沿 `ofFeature` 回溯到草图面来识别, 并拒绝之且给出替代做法
- `test/associativity.test.ts` — 关联性门控的两种**误判**(把真在驱动几何的参数报成"装饰性"): ① 模型常把一条尺寸写成多个实体 (`LENGTH [e1,e3]=120`), 而 reconcile 只读单标签尺寸且**静默跳过**其余 —— 参数因此确实不驱动几何, 变成冤枉参数; ② 探测指标 (体积/包围盒/面数/质心) 对"特征在零件内部移动"全都不可见, 故探测器补上顶点矩 (Σ到原点距离平方, 与顺序无关, 一次网格化)
- `lib/cad/jpeg.ts` + `test/jpeg.test.ts` — 手写基线 JPEG 解码 (SOF0/Huffman/4:4:4/4:2:2/4:2:0/4:1:1, 灰度与彩色), 仍无任何图像依赖; 渐进式 JPEG 按名拒绝。此前 JPEG 会静默降级**两件事**: 轮廓提取看不到图 (退化成读文字描述) 且 L4 整体跳过
- `lib/cad/image.ts` 的阈值改为**按图自适应** (Otsu): 固定 128 是在赌图纸是纯黑白的, 而实测一张真实接触网图纸 89% 接近纯白、线条是中灰, 只有 1% 低于 128 —— 无闭合区域、无剪影、门控无从比对。另: 单件图纸的最大闭合区域占绝对多数 (实测板 83%), 装配图不然 (吊弦图 13%/64 个区域), 低于半数即不建参考并说明"这看起来是装配图"
- **L4b 轮廓-墨迹距离门** (`lib/validators/edge_distance.ts`): L4 要一份"就是零件的闭合区域", 而标注密集的单件图纸没有 (实测全尺寸标注图 143 区域最大占 19%), 于是**最需要复核的图上形状门是哑的** —— 一次报 `PASSED` 的运行, 其重投影轮廓有一半离图纸任何墨迹 >30px。L4b 改为量**模型轮廓到图纸墨迹的距离**, 不需要闭合区域 (标注只会让它偏宽松, 不会让它无法计算)。四条使数字有意义: ① 比对在**图纸自己的像素栅格**上做 (把 1px 线升采样到更大网格会变成虚线, 正件会平白读出 2-3px); ② **两道闸都要过** —— 绝对项 (帧对角线占比) 问"轮廓在不在图上", 机会项 (相对"任意摆放"能拿到的距离) 问"是否显著优于瞎放"; 实测正件 0.003-0.13 vs 错件 0.30-0.69; ③ 机会项有 **1px 地板** (正件轮廓与画的线本来就差一个像素); ④ **摆放做搜索但窗宽限于帧短边 25%/每轴**, 比例尺 ±20% —— 全帧自由平移实测把"两个圆盘"挪到 94% 帧距的密集角落拿 3.9px 从而**不该过也过了**。`reference.ts` 在拒掉 mask 时仍产出 `maskUsable: false` 的墨迹参考 (墨迹=整个视图区域, 帧来自图纸标注的比例尺, 且注明"没有剪影可校核该估计"); 该视图跳过 mask 门但照跑 L4b, 落盘的 reference PNG 就是墨迹本身
- **修复环收敛的度量要跟着"哪份度量存在"走**: 有剪影时用 mask IoU, 没有时用 L4b 的机会比值 (`silhouetteScore`)。少了后者, 标注类图纸上**修复环无度量可收敛** —— 一次把距离减半却仍留同一个阻塞问题的修复会被判成"什么都没改"而拒绝, 环就此停在错件上、少修一轮。用比值而非裸像素, 是因为像素在不同密度的图上含义不同。度量本身也随提示语交给模型: 除距离外还给"瞎放基线"与**最差十分位在模型自身范围里的位置** (`worst.atExtent`, 0,0 是左下), 并明确说明摆放与整体缩放**已被搜索过**, 故 `EDG_OUTLINE_MISMATCH` 不可能靠平移/整体缩放修掉
- **描出的坐标尺寸必须与图纸声明的尺寸对账** (`lib/cad/scale_fit.ts`): 轮廓提示语给了 `mm/px`, 但没有任何东西强制模型照办, 且**声明该尺寸的那条约束会因为几何对不上而被丢弃**, 于是参数什么都不驱动、所有门都对此沉默。现按声明尺寸拟合整体比例, 判据刻意收窄: ① 只有**跨越剖面自身范围**的尺寸才算证据 (跨度须与剖面宽/高相差 15% 以内, 孔径/壁厚不算, 否则会把整个零件缩成配合一个特征); ② 声明值与所量跨度之比须在 1.5 倍以内 (60 高的板两条长边相距 120, 比值 2 是"另一个量"而非"比例错"); ③ 写成表达式的尺寸 (`value: "overallHeight"`) 会先按参数解析; ④ **全树一个比例, 绝不逐 sketch** —— 零件是一套坐标散在轮廓与其中的孔上, 只缩轮廓实测把孔甩到体外、内核 cut 直接崩 (`NCollection_Sequence::ChangeValue`); ⑤ 两条尺寸互相矛盾 (隐含比例相差 >25%) 时不平均、不猜测, 保留描出的尺寸并连数字一起报出。先拟合正是把"被丢弃的约束"变成"被应用的约束"的关键。**与其它假设一样要过内核验证**: 拟合后的几何建不出来而描出的能建出来时, 保留描出的实体并说明原委。**⚠ 教训**: 真图纸上它算出 0.798、"看起来剖面偏大 25%", 但真正的原因是 `reconcile` 把发出的轮廓吹大了 69% (下面那两条); 那两条修好后同一条剖面量出来就是声明的 150、**拟合什么都不做**。"真正的尺度错"与"几何缺陷"从这里看一模一样, 只有查清几何**为什么**对不上才能区分
- **`cropRaster` 把 `colorful` 丢了, 于是"颜色即图层"这条从来没生效过**: `extractSilhouette` 里写着"图纸常用颜色分层 (零件黑、尺寸蓝), 按亮度读会把标注当材料", 判据也用上了 —— 但**裁剪函数只复制 gray/opaque**, 而参照构建器**每个视图都要裁剪**。实测同一张全标注图: 直读 4 区域/最大 79%, 走裁剪路径 143 区域/最大 19% (即这条信息被丢掉后, 门只能拒掉整张图)。已修 (裁剪一并复制 `colorful`)。**但这次修复单独发货会让结果变差**, 见下一条
- **"最大区域占封闭面积的比" 不是"这是不是零件"**: 修好裁剪后同一张图上 `maskUsable` 翻成 true —— 因为最大的封闭区域是角色的一只**眼睛**: 占封闭面积 79%, **占整张图 1%**。按封闭面积占比看它像个整件剪影, 于是门会拿"一只眼睛的图"去判模型。故加第二道: **最大区域自身面积占整张图的比例** (实测 62% 的板 vs 1% 的细节, 取 5% 作地板, 两侧各留 5~12 倍余量)。修好后该图回到"拒掉 mask、只跑墨迹门", 与修复前一致
- **该插图的两个图层都没有零件**: 逐层量过 —— 中性层 (暗且非彩色) 最大封闭区域 148x281px = 整图 1.00%; 彩色层 1080x43px = 0.16% (一条边框)。原因是这张图的**轮廓本身不够暗** (插图是彩色的, 线条在中亮区), 按 Otsu 阈值根本不进 ink。所以这张图难的**不是颜色分层, 而是阈值** —— 之前的 `largestShare` 闸门只是碰巧把它拦下了。仅此记录, 未动阈值
- **"能不能局部把剖面吸附到墨迹上" 已试过, 结论是: 在标注密集的图上不可验证, 故不做** (2026-09). 做法是移动剖面**顶点** (相邻实体共享顶点, 所以拓扑与半径天然不被破坏), 用同一个测量决定每次移动是否保留. `relaxProfileToInk` 一度写出来并跑通, 但把"允许单个顶点移动多远"这个上限扫一遍是决定性的:
  ```
  cap   8px: mean 19.4px -> 18.0px, 机会比 0.68 -> 0.63
  cap  21px: mean 19.4px -> 16.6px, 机会比 0.68 -> 0.58
  cap  65px: mean 19.4px -> 13.6px, 机会比 0.68 -> 0.48
  cap 130px: mean 19.4px -> 12.0px, 机会比 0.68 -> 0.42
  ```
  **改进随上限单调上升、不出现平台期**. 真正找到零件轮廓的松弛会在到达轮廓时停住 —— 轮廓之外没有更好的去处. 没有平台期说明收益很大程度是"整体往墨迹最密处滑", 而在标注图上**尺寸线与箭头也是墨迹**, 测量分不出哪个词是哪个. 于是这段代码**删掉了**: 一个"成功与失败无法区分"的机制不能悄悄运行. 替代路径是已发货的那条 —— 测量并**点名**不follow墨迹的实体, 交回树阶段重瞄, 其结果随后由轮廓门在建出来的实体上验收. 诊断脚本留在 `/tmp/i2c-run/probe1[234].mjs`
- **剖面在读出来之后立刻对墨迹量一次** (`lib/validators/profile_to_ink.ts` + `lib/cad/chamfer.ts`): 轮廓门量的是**建出来的实体**, 那是算数的判词 —— 但它要一次四分钟的运行才拿到, 且只能说"形状不对", **说不出 31 段里是哪几段**(网格不带 tag, 剖面带)。这条门把同一件事**提前一个阶段**做: 对剖面逐实体算它自己的点到墨迹的距离, 不需要内核, 于是产出的是**带名字的嫌疑名单** —— 实测某真图纸上 `e27 line 111px`、`a26 arc 94px`、`e17 40px`… 这份名单与测量数字一起进**特征树提示语** ("Where an entity is named above, its traced coordinates are the thing to distrust. Re-aim it at the ink rather than repeating it, and keep the topology"), 于是树阶段可以改, 而不是照抄一个它没理由怀疑的坐标。判据与轮廓门同一套 (绝对项 + 机会项 + 1px 地板), 共用 `lib/cad/chamfer.ts` 里的距离场采样与摆放搜索。**关键设计: 它是测量不是判词, 所以只出 warning、不进 review** —— 树可以**合理地偏离**它拿到的剖面 (模型从图纸上读到"腿宽 6"就是对的, 哪怕描图方画成了 12), 为描图方的错去否掉整次运行会拒掉一个正确的模型; 产物的判词留给看得见产物的那条门. 该文件顶部与 `onInk` 这个命名 (不叫 `passed`) 都是为挡住这个误读
- **参照剪影的构建前移到 stage A 之后**: 它只依赖图纸与视图集, 与 B/C 阶段无关; 前移后 B 阶段一读完剖面就墨迹在手可以量, 附带好处是整次运行只解码一次图纸
- **弧线端点不在自己圆上, 要在读图层就报出来** (`DIN_ARC_INCONSISTENT`, `lib/validators/design_intent.ts`): 12/15 条弧的端点偏离自己声明的圆 10%~67%。`reconcile` 会修 (端点保留、圆心移到中垂线), 但那是**对几何的猜测**, 悄悄做掉等于从不告诉描图方。现作为**静态树检查**报 warning (无需发射或建实体), 并进 `MEASURED_CODES` + `isWorthRefining` ⇒ 修复环会真的拿到这一轮。同时把 `ReconcileReport` 里"几何被改动"的条目从 `applied` (混着例行尺寸应用, 作为 warning 会淹没) 拆到新字段 `repaired`, 由 feature_codegen 逐条报出 —— 此前它们**哪儿都没到**
- **`reconcile` 会把发出的轮廓吹大 69%, 两个独立机制** (真图纸实测: 端点跨距 125x150 的剖面, 发出的是 210x253):
  - **① 弧线与自己的端点不自洽**: 15 条弧里 12 条的端点根本不在它自己声明的圆上 (偏 10%~67%), 而端点链一路精确 (间隙 0.0000)。`anchorEntity` 按半径重建弧 ⇒ **端点被丢弃、弦被改写成该半径隐含的长度**, 误差沿闭环累积。修法: 端点定死后圆心可沿弦的中垂线滑动, 中垂线上**恰有一点**到两端距离都等于给定半径 (声明的圆心只用来定在哪一侧), 实测 15 条**每一条**都可行 ⇒ 端点与半径同时保住。半径小于弦所必需时才会退化成半圆并报出。这一条修掉 103 单位过量中的 51 (253→202)
  - **② 声明方向被当成了"指向"**: `ORIENTATION [1,0]` 是**轴**不是方向 —— "水平"不区分沿 x 往哪边走, 同一个向量命名两种走法。当成指向就会**翻转每一条描成反方向走的边**: 实测 6 条边被发出成反向 (描的是 (-19.5,0), 发出 (+19.5,0)), 把 272 单位误差灌进一个自身只有 125x150 的闭环, 最后一条边把余量全吞下。修法: 声明方向与描出的方向点积为负时取反 (轴仍然满足, 走法得以保留)。两条都修好后**每个实体都回到刚性**, 发出的轮廓与描出的逐位一致 (125x150)
  - 教训: 前两轮把这个"涨大"读成了"描图的尺度不对", 于是有了 `scale_fit` 的 0.798 —— 它补偿的是这两个 bug。**"发出的几何 ≠ 描出的几何"必须先证明, 再去解释尺度/形状的偏差**

- **第二个"造实体"特征 (pad/revolve/sweep/loft) 必须 union 而不是赋值**: `bodyLhs` 首义 `let body =`, 其后返回 `body` 直接赋值 —— 于是模型辛苦描出的第一段实体被第二段覆盖丢弃。实测某树先是一块 100×200×10 的吊弦轮廓 (体积 56000 / 26 面), 再是两个线盘, 成品只剩线盘 (用户原话 "只生成了两个圆盘")。现改为 `body = body.union(..., true, false, 0)` 并出 `DIN_MULTIPLE_BODIES` 警告 (本流水线只建一个零件, 多零件图纸的结果是并集而非装配)
- **`industry` 行业提示语** (`CadPipelineConfig.industry` / CLI `--industry` `--industry-file`): 注入三个阶段的提示词, 用于**命名与建造顺序**; 提示词里明确写着它**不是证据** —— 尺寸形状仍须来自图纸, 否则提示语就变成编尺寸的许可证。实测同图: mimo 无提示语给出 3 特征粗树; deepseek-v4.1-flash + 吊弦提示语给出 25 实体轮廓、参数命名 clampHeight/heartHalfWidth/tubeRadius/wireHalfWidth、推出 1200mm 吊弦长度并派生其余尺寸; 提示语里"整幅外形轮廓该用 pad 而非 revolve"那句把它从错误构造上拉了回来
- **`solve()` 抛异常不再毁掉整个模型**: 内核 NLopt 后端对某些约束集直接抛 ("Sketch.solve: nlopt failure", 实测于 1200mm 吊弦轮廓)。solve 只是交叉校验(不回写), 故发射时包 try/catch, 记为 `status:-1/cost:Infinity/note`, 由 L3 如实报告 —— 实体与 STEP/STL 都保住
- **导出的 STL 要拿实体体积对账**: 结构合法 ≠ 闭合。内核会跳过它三角化不了的面并只在日志里说一句 ("N faces have been skipped due to null triangulation"), 结果是看起来正常、切片崩掉的 STL。吊弦那次只剩 **66.7% 的体积**(50 面里少 2 面)。现 exportShape 报 `watertight` / `volumeRatio` 并把结论写成话; STEP 不受影响 (它带的是 BREP 不是三角化)
- `test/emitter_guards.test.ts` — 绑定没有的约束种类 (HORIZONTAL/VERTICAL/PARALLEL/TANGENT/SYMMETRIC) 一律 `undefined`, 而把 `undefined` 当枚举传进 Embind 会抛出一个**消息本身就是 undefined** 的错误 —— 实测让整次运行的实体全丢。现 HORIZONTAL/VERTICAL 精确翻译为 `ORIENTATION`, 其余按名拒绝; 同一节也钉住"选择器写成了句子"(会在 marshaller 里崩) 与"通孔复用垫块自己的草图"(会把整个实体切没)
- `test/refine_loop.test.ts` — 修复环(此前每次联调都设 `maxRefinements: 0`, 从未真正跑过): 用真内核 + 脚本 provider 驱动"测得尺寸不对 → 把测量交回 → 改树 → 只在真的更好时才采纳"。含"空转的修复必须被拒"与"比例尺已核实过时不得叫模型去改尺寸"两条
- `lib/cad/chain.ts` — 把 `chainEntities`/`findConnectedComponents` 从 sketch_codegen 提出: 原先 sketch_codegen ⇄ reconcile 互相 import (构建时一直有循环依赖告警), 而两者都需要的只是轮廓拓扑, 与任一层无关。另加 `findClosedComponents`: 一个 sketch 里有若干个各自闭合的轮廓是设计而非缺陷(一期四孔), 此前一律报成 "entities do not form a single closed chain" 并整体跳过 —— 既是假告警, 又导致多轮廓草图里的尺寸从未被施加到坐标
- `test/connectivity.test.ts` — 连通性只能表述一次且必须是绑定实现的那种: 模型写的 `COINCIDENT`(绑定语义是"两段重叠")与发射器自行推导的 join 会就同一对边各说一句互相矛盾的话, 实测残差 6986.67; 去掉模型那句后为 **0**。含把旧发射结果的残差直接对内核重放的对照
- `test/reference.test.ts` 另含比例尺再对齐: 用真实那次运行的原始数字 (120mm/684px/597px 剪影) 断言框宽回到 120mm
- `test/llm.test.ts` / `test/sketch_expressions.test.ts` / `test/view_plane.test.ts` / `test/multi_profile.test.ts` — 真实 LLM 联调催生的修复: 网关 `x-opencode-session` 头与 thinking 模型 token 预算、**sketch 几何里的表达式求值**(模型天然会写 `"end":["overallWidth",0]`)、视图→草图基准面映射 (front→XZ)、多轮廓 sketch (四孔一次成型的实测体积与解析值一致)
- `test/llm.test.ts` 另含 **thinking 模型烧完预算后重试一次(预算翻倍)**: 实测 `deepseek-v4.1-flash` 32768 token 全花在思考上、`content` 为空, 把一次已跑了四分钟的运行杀死在最后一步 (特征树合成)。只在"只有思考没有答案 / `finish_reason=length`"时重试 —— 答案**本就是空串**属于提示语问题, 重试只会白花一次调用; 重试经 `onLog` 出声(等待翻倍不能静默), 两次都空则报出预算并说明思考与答案共用它
- `test/export.test.ts` — STEP/STL 导出: 字节真落在宿主 FS、STEP 头/`DATA`/终止符、STL 二进制且 `84+50n` 对齐、deflection 真的改变网格密度; 并用**三角片有符号体积**反证 STL 闭合且外向 (体积与 BREP 对齐)
- 改了 `lib/` 或 `cli/` 后若要跑 `topo-img2cad` 命令, 必须先 `pnpm --filter topo-img2cad build` (CLI 从 `dist/` 跑)

## CadQuery 兼容层

- **`packages/topo-primitives/lib/cq/index.ts`** — `CQWorkplane` 链式 shim (经 `lib/index.ts` 以 `CQ` 命名空间导出), 方法名与 go-topo `workplane.go` 的 Go 便捷封装一一对应 (`boxCentered`/`circleCentered`/`extrudeSimple`/`holeThrough`/`loftSimple` 等), 内部调 Embind 绑定的 `tp.Workplane` 并负责参数换序/枚举映射 (`cutThruAll(taper,clean)` 换序、`workplane()` centerOption 数字→枚举、`offset2D` kind 数字→`GeomAbs_JoinType` 数值、`rarray` center→二元数组)。helper: `pnt/vec/gpVec` (gp_Pnt/Vector/gp_Vec 构造)
- **`box` 绑定** (`src/workplane_bindings.cc`) 为手写补绑 (生成器因重载+`std::array` 跳过), `boxCentered` 必须走它 — **不要**用 `rect+extrude(both=true)` 组合, `extrude(both=true)` 是 go-topo C++ 核心 bug (产出空 shape, Go 原生同现, 未修)
- workplane 17 个重几何方法 (fillet/chamfer/shell/extrude/loft/cutThruAll/cboreHole/cskHole/hole/twistExtrude/offset2d/revolve/sweep/cut/union/intersect/box) 绑定层已将 C++ 异常翻译为可读 JS Error
- **草图约束求解 (NLopt) 已补齐**: `Sketch.constrain(tag[, tag2], kind, value)` + `solve()` + `solve_status()` + `SketchConstraintKind` 枚举 (`src/sketch_bindings.cc`)。value 编组: number→double / `[a,b]`→double2 / `[t1,t2,d]`→double3 (null→none) / 省略→blank。求解后 DOF 在 `solve_status().x` (segment=[x1,y1,x2,y2], 三点弧=[cx,cy,r,a1,a2]), `status` 1-4 为 nlopt 成功码。测试: `test/cq_sketch_solver.test.ts` 33 例 (移植 go-topo `TestSketchSolver_*`, 含几何核验)
- **装配约束求解已补齐 (NLopt 后端)**: go-topo `solver.cc` 已从 Ipopt 整体切换为 NLopt LD_SLSQP (Ipopt 依赖移除; 顺带修复 Ipopt 时代被静默掩盖的 `to_pods()` entityIndices 恒空 bug — 此前装配 solve 从未真正生效)。绑定: `Assembly.constrain/constrain1/constrain2/constrain3` + `solve(verbosity?)` + `hasError()/getError()` + `AssemblyConstraintKind` 9 值枚举 (`src/assembly_bindings.cc`), param 编组 number/`[a,b]`/`[x,y,z]`/省略。测试: `test/cq_assembly_solve.test.ts` 9 例 (含位移拉回/定点移动几何核验, 与 go-topo `TestAssemblySolve_GeometricVerification` 同口径)
- **go-topo `safe_call` 粘性错误语义**: Go C API 把每个 workplane 调用包在 `safe_call` 里, 任一调用抛异常后 ctx 置错误标志, **后续所有调用短路 no-op**, 链冻结在抛出点前置状态 (go-topo 33 例中 7 处 golden 退化结果都源于此: 07/19/28/29/30/33)。Embind 绑定**不经** safe_call, 异常原样抛出 — TS 测试用 `Chain`/`safe` helper 显式复现该语义做 parity, 这不是 topo.js 的 bug, 但意味着**两套 API 的错误行为不同**: Go 静默退化, JS 抛异常
- **go-topo cq 层两处"静默产空"语义** (Go 原生同现, 非 WASM bug): ① `topo::revolve` 对**旋转轴穿过截面**的轮廓静默跳过 (私有 try/catch, `_revolve` 返回空 compound) — CadQuery 标准做法是**偏离转轴的闭合轮廓** (折线偏移轮廓 revolve 正常); ② `workplane::cut(workplane)` 经 `select_shapes(vals())` 提取切割工具, 给"画圆再挤出"的 workplane 会错取轮廓 face 导致切空 — 切割工具用 `cylinder()` 等直接成型的 workplane (实体在栈首) 则正常
- 其他 go-topo cq 层语义偏差 (golden 已如实复现): `val()` = 栈首对象 (example_25 只含末次挤出, 不含基座), `Value()` 经 C API 类型切片体积不可得 (golden 仅 bbox 可对账), `shell(kind="")` 必抛 `Unknown join type` (go-topo 示例传 `""` 是移植错误, CadQuery 应为 `"arc"`), Embind 侧 `extrude` 的 `taper=0` 视为启用拔模 (传 `undefined` 才是无拔模, 与 C API 的 0→none 口径不同, shim `extrudeSimple` 已处理)

## go-topo 同步基线

**本地补丁 (未提交上游)**: `go-topo/src/face.cc` `face::make_from_wires` 删除冗余的 `faceBuilder.Add(wireRef)` — 构造器已把该 wire 注册为外环, 重复 Add 会把同一条 wire 再注册为内环, OCCT 对内/外环重合返回**两个重合面**的 compound, 于是 workplane `get_faces()` 回退路径产出两个面、`extrude` 挤出两个重叠棱柱: 体积恰好翻倍且 `isValid() === false`。影响 `Workplane.polyline().close()` / `moveTo-lineTo-close` / `Workplane.rect`(CQ shim 全部暴露)。修复后 `cq_examples` 的 25/28/29 三例 bbox 合法漂移并已按上述流程重生成 (其中 29 原本是 x/y 零展布的**退化直线**, 现为 101×151×99 实体; 25 纳入更多几何; 28 仍属 `safe_call` 退化链)。`test/workplane_full.test.ts` 的 `Workplane profile extrusion validity` 覆盖此修复。**内环绕向 (已分析, 未落地)**: OCCT 把与外环**同绕向**的内环读成凸台而非孔 —— 面拓扑正确但材料侧反了 (面积被加上而非减掉, 实体 `isValid()` false)。修复方案已实测成立: 用 `ShapeFix_Face::FixOrientation()` (与 `face::make_face(wire, vector<wire>)` 同法), 并以「内环取样点确实落在外环内」为闸门 (`BRepClass_FaceClassifier`)。**闸门不可省**: `workplane::get_faces()` 把首条之后的 wire 一律当内环, 对互不相交的轮廓 (braille 例的 6 个独立圆) 是误判, 无闸门修复会把该例压平。带闸门时 35 条 golden 保住 34 条。**未落地的唯一原因**: 剩下那一条 `example_29_enclosure` 是 `safe_call` 退化链, 其 golden 记录的是**链在哪一步冻结**而非几何; 修复使 WASM 与 Go 的冻结点分叉 (WASM 侧抛裸指针异常), 而两侧 OCCT 同为 7.7.2 同一份源码, 差异源于 AGENTS 已记载的「Go 静默退化 / JS 抛异常」语义分歧。**落地前提**: 先决定那 7 条退化 golden 该如何断言 (例如改为断言"退化/抛异常"而非 bbox)。当前由 `test/workplane_full.test.ts` 的 `it.fails` 与 go-topo `face_wire_winding_test.go` 的 skip 项各自钉住。

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
- **绑定缺口清单** (剩余测试 skip 项 ~21, 未绑/不可用于 WASM):
  - Assembly 参数化注册表**已移植**: `lib/assembly/parametric.ts` (纯 TS 实现 Go 的 assembly_parametric.go — 全局 builder 注册表 + ParametricAssembly 组合原生 Assembly + JS 侧配方状态, JSON schema 与 Go 互通), 经 `Assembly` 命名空间导出
  - helix sweep/fitCenterline **已解锁**: 崩溃根因是 TS 测试参数与 Go `CreatePipe` 不匹配 — Go 内部用 Frenet 模式扫掠, 测试须 `sweepWithFace(face, path, combine, clean, isFrenet=true, TRANSFORMED)`; 非 Frenet 螺旋管拓扑不同, `fit_centerline_from_shape` 对有端盖实体不回退 PCA 是设计行为 (bounding_pipe.cc:655)
  - dxf **已编入并绑定** (DxfShapeReader/DxfShapeWriter, `src/dxf_bindings.cc`): `std::set<std::string>` embind 不支持需转 vector 注册; dxf_shape 的 entity value_object 未绑 (需要时再补)
  - `assemble()` 在 `sketch.circle()` 之后调用会**崩裸指针** (单个圆也崩), 且 `circle(r,mode,tag)` **没有圆心参数**, 所以"一个 sketch 里画多个圆"在这个 API 上做不到 —— topo-img2cad 的多轮廓 sketch 改为**每个分量单独 sketch + 各自 extrude + union**, 见 `lib/cad/sketch_codegen.ts` 的 `MultiComponentProfile`(返回的是个只暴露 `extrude`/`val` 的小对象, 不是 Workplane, 故 revolve/sweep/loft 用多轮廓 sketch 会被显式 skip)
  - `Shape.exportStep`/`exportTo`/`writeToStl` 在 WASM 写**非 `/tmp/` 路径**失败 (emscripten MEMFS 不映射宿主 FS), 统一用 `/tmp/` 路径 + `tp.FS.readFile` 读回验证 (topo-img2cad 侧已封装为 `lib/export.ts` 的 `exportShape`, 并校验文件结构)。另: STEP 导出会把 OCCT 传输统计打到 **stdout** (`loadKernel({ onKernelOutput })` 可改道 stderr), `--json` 模式必须改道否则 JSON 被污染
  - `Edge.makeSpline` 已修复: 可选参数 tolerance/periodic 改为 `emscripten::val`, 缺省 `1e-6`/`false`
  - `Edge.makeEdgeFromCurve` 仍不接受 `Handle_Geom_TrimmedCurve`; 已补 `Edge.makeEdgeFromCurveTrimmed(trimmedCurve)` 包装函数
  - `makeSolidFromCylinderAngle(R,H)` 已修复: 缺省 angle=2π (完整圆柱), mass 正确
  - go-topo 的 Point2/Dir2/Line/Trsf/XY/Vector2/SketchObject 是 Go 层包装类型 (C++ 无对应类), 测试已用已绑的 gp 类 (gp_Pnt2d/gp_Dir2d/gp_Ax2d/gp_Circ2d/gp_Trsf 等) 适配解锁; 仅 `TestGeomConstants` (Go 层枚举常量) 与 `sketch object from nil` (Go 侧同样 skip) 保持 skip
  - `Shape1D.params(gp_Pnt[])` 已修复数组编组; `Quantity_Color` 用 `new tp.Quantity_Color_3(r,g,b,tp.Quantity_TOC_RGB)` 构造, `SetValues_2` 可用, `Values()` 因 C++ output reference 参数 embind 无法编组, 用 `Red()/Green()/Blue()` 替代
  - `gp_Cone_2(ax3,angle,radius)` 已修复, 可正常使用
  - `Shape.location()` 已修复: 返回 `topo_location` 对象 (含旋转), 可直接传回 `setLocation()`
  - 2D 类型族 (Point2/Dir2/XY/Vector2/独立 Trsf) 未暴露; `Quantity_Color` 用 `new tp.Quantity_Color_3(r,g,b,tp.Quantity_TOC_RGB)` 构造
- **`Assembly.getElements()` 已修复** — 原 `assembly_element` value_object 无法转 emval, 改为返回 plain JS object `{shape, name, location, color}`; 遍历装配仍推荐 `children()` / `name()` / `obj()` / `flatten()`
- `Assembly.create` / `add` 依赖全局注册, 库里经 `ensureAssemblyGlobals` (`lib/railway/layout_utils.ts`) 兜底; 测试/脚本里直接用装配 API 时需先经库函数或手动调用。同理 `Location` 构造器对 `gp_Trsf`/`TopLoc_Location`/`gp_Pnt`/`gp_Vec`/`gp_Pln`/`topo_vector` 做 instanceof, 用前也需注册同名全局 (参考 `test/cq_assembly_solve.test.ts` 的 beforeAll)
- `Assembly.create/add` 的 `loc` 参数走值类型编组 (`as<topo_location>()`), 传 `new tp.Location(...)` 构造的对象; `Location` 类是按值注册的, 不是 shared_ptr
- Embind `value_object` 字段必须全量初始化, 缺字段报 `Missing field: "xxx"`; enum 字段用 `tp.EnumType.VALUE` 赋值, 不要传裸数字
- **测试文件的全局类注册必须无条件覆盖** (`g[name] = tp[name]`): vitest 给每个测试文件独立的模块注册表, `helpers/topo.ts` 的单例在不同文件间可能是**不同的 WASM 实例**; `if (g.X === undefined)` 守卫会让先跑文件的类残留在全局, 后续文件的 embind 对象对它做 `instanceof` 必失败 ("Right-hand side of 'instanceof' is not an object" 或静默错路由)
- 不要在 `packages/topo-primitives` 跑裸 `tsc` (会把 `.js`/`.d.ts` 写进 `lib/` 源码目录), 构建用 `pnpm build` (rollup)
