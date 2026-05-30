WORKDIR := $(CURDIR)
TOOL := $(WORKDIR)/build/topo
CONFIG := gen/topo.full.yml
THREADING := single-threaded

.PHONY: all help clean tool ogg topo topo-bindings bindings gen-ts run rebuild multi

# ─── 完整构建（常用） ────────────────────────────────────────────────

all: tool ogg topo topo-bindings bindings run gen-ts
	@printf '\n✅ WASM 构建完成: packages/topo-wasm/src/topo.full.{js,wasm,d.ts}\n'

# 快速重编：跳过 OCCT，只重编 go-topo + bindings + 链接（日常开发用）
rebuild:
	$(MAKE) topo topo-bindings bindings run gen-ts
	@printf '\n✅ 快速重编完成\n'

# 多线程完整构建
multi:
	$(MAKE) all THREADING=multi-threaded

# ─── 分步构建 ────────────────────────────────────────────────────────

tool:
	@printf '=== 1/6: 构建 gen 工具 ===\n'
	cd gen && go build -o $(TOOL) ./cmd/

ogg: tool
	@printf '=== 2/6: 编译 OCCT 库 ===\n'
	$(TOOL) build-ogg -d $(WORKDIR) -t $(THREADING)

topo: tool
	@printf '=== 3/6: 编译 go-topo 源码 ===\n'
	$(TOOL) build-topo -d $(WORKDIR) -t $(THREADING)

topo-bindings: tool
	@printf '=== 4/6: 编译 bindings 源码 + TS 定义 ===\n'
	$(TOOL) build-topo-bindings -d $(WORKDIR) -t $(THREADING)

bindings: tool
	@printf '=== 5/6: 编译自定义绑定代码 ===\n'
	$(TOOL) build-bindings -d $(WORKDIR) -t $(THREADING)

run: tool
	@printf '=== 6/6: 链接 WASM ===\n'
	$(TOOL) run -d $(WORKDIR) -c $(CONFIG) -t $(THREADING)

gen-ts: tool
	@printf '=== 可选: 生成 TypeScript 定义 ===\n'
	$(TOOL) gen-ts -d $(WORKDIR) -c $(CONFIG)

# ─── 清理 ────────────────────────────────────────────────────────────

clean:
	@printf '=== 清理构建产物 ===\n'
	rm -rf $(WORKDIR)/build/*
	rm -f $(TOOL)
	@printf '✅ 清理完成\n'

# ─── 帮助 ────────────────────────────────────────────────────────────

help:
	@printf '\n用法: make [target]\n\n'
	@printf '目标:\n'
	@printf '  all       完整构建（OCCT + go-topo + bindings + 链接）\n'
	@printf '  rebuild   快速重编（跳过 OCCT，日常开发用）\n'
	@printf '  multi     多线程完整构建\n'
	@printf '  clean     清理构建产物\n'
	@printf '  tool      只构建 gen 工具\n'
	@printf '  ogg       只编译 OCCT 库\n'
	@printf '  topo      只编译 go-topo 源码\n'
	@printf '  topo-bindings  只编译 bindings 源码\n'
	@printf '  bindings  只编译自定义绑定代码\n'
	@printf '  gen-ts    只生成 TypeScript 定义\n'
	@printf '  help      显示此帮助\n'
	@printf '\n示例:\n'
	@printf '  make              # 完整构建\n'
	@printf '  make rebuild      # 修改 bindings 后快速重编\n'
	@printf '  make ogg          # 只编译 OCCT\n'
	@printf '  make multi        # 多线程完整构建\n'
	@printf '  make clean && make  # 完全重编\n'
