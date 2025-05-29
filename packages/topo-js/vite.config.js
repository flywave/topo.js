import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "topo",
      fileName: "topo",
      formats: ["es", "umd", "cjs"],
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['topo-wasm', 'three'] // 添加three到外部依赖
    }
  },
  plugins: [
    process.env.NO_TYPES?.toLowerCase() === "true"
      ? null
      : dts({
          rollupTypes: true,
        }), wasm(),
        topLevelAwait()
  ].filter((a) => !!a),
  optimizeDeps: {
    exclude: ['topo-wasm', 'three'], // 同时在optimizeDeps中排除three
  }
});