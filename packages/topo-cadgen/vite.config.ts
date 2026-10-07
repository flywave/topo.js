import { resolve } from "path";
import { defineConfig } from "vite";

// The editor host build: one page, the app + builtin panels bundled, the
// kernel copied in by the build:editor script (`cp topo.full.* dist/`).
// base './' so cadgen-serve can mount dist/ at any path prefix.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
  optimizeDeps: {
    exclude: ["three"],
  },
});
