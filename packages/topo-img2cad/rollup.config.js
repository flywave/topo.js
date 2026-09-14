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
