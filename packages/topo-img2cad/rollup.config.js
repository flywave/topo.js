import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-ts";
import sourcemaps from "rollup-plugin-sourcemaps";
import terser from "@rollup/plugin-terser";

const external = [
  "topo-primitives",
  "topo-js",
  "topo-threejs",
  "topo-wasm",
  "three",
];

/**
 * Node built-ins stay external for the CLI bundle.
 *
 * It runs under Node by definition — it loads a 66MB wasm file off disk — so
 * bundling a shim for `fs` would be work spent making the wrong thing work.
 */
const NODE_BUILTINS = [
  "fs",
  "path",
  "url",
  "module",
  "zlib",
  "os",
  "util",
  "crypto",
  "process",
  "events",
  "stream",
  "buffer",
];

const externalForNode = (id) =>
  external.includes(id) || id.startsWith("node:") || NODE_BUILTINS.includes(id);

export default [
  // ESM build
  {
    input: "lib/index.ts",
    output: {
      file: "dist/es/index.js",
      format: "es",
      sourcemap: true,
    },
    external,
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      sourcemaps(),
    ],
  },
  // CLI build — without this the `bin` entry points at a file that never existed
  {
    input: "cli/index.ts",
    output: {
      file: "dist/es/cli/index.js",
      format: "es",
      sourcemap: true,
      banner: "#!/usr/bin/env node",
    },
    external: externalForNode,
    plugins: [
      resolve({ browser: false, preferBuiltins: true }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      sourcemaps(),
    ],
  },
  // UMD build
  {
    input: "lib/index.ts",
    output: {
      file: "dist/umd/index.js",
      format: "umd",
      name: "TopoImg2Cad",
      sourcemap: true,
      globals: {
        "topo-primitives": "TopoPrimitives",
        "topo-js": "TopoJs",
        "topo-threejs": "TopoThreejs",
        "topo-wasm": "TopoWasm",
        three: "THREE",
      },
    },
    external,
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
      sourcemaps(),
    ],
  },
];
