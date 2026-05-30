#!/bin/bash
# 生成 WASM 兼容性补丁：比较 go-topo 原始 OCCT 与本项目已修改的 OCCT
# 用法: cd /path/to/topo.js && bash patch.sh

set -euo pipefail

ORIG="../go-topo/external/ogg"
MOD="./external/ogg"
OUT="./gen/patches/wasm.patch"

if [ ! -d "$ORIG" ]; then
  echo "❌ 找不到原始 OCCT 源码: $ORIG"
  echo "   请确保 go-topo 位于 ../go-topo"
  exit 1
fi

if [ ! -d "$MOD" ]; then
  echo "❌ 找不到本项目 OCCT 源码: $MOD"
  exit 1
fi

echo "生成补丁: $ORIG → $MOD"
diff -ruN "$ORIG" "$MOD" > "$OUT" || true

echo "✅ 补丁已写入: $OUT ($(wc -l < "$OUT") 行)"
echo ""
echo "应用补丁: patch -p0 < $OUT"
