import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-ts";

export default {
  input: `lib/index.ts`,
  output: [
    {
      file: "dist/umd/index.js",
      name: "replicad",
      format: "umd",
      sourcemap: true,
    },
    {
      file: "dist/cjs/index.js",
      name: "replicad",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/es/index.js",
      format: "es",
      sourcemap: true,
    },
  ],
  watch: {
    include: "lib/**",
  },
  plugins: [typescript(), commonjs(), nodeResolve()],
};