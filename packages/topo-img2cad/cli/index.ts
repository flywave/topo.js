#!/usr/bin/env node

/**
 * topo-img2cad — turn a reference image into a parametric CAD model.
 *
 * Two ways in, and the difference between them is the point of the tool:
 *
 *   <image>            the whole pipeline, model-driven, then measured
 *   --tree <tree.json> replay a saved feature tree with no model involved
 *
 * The second is what makes the output CAD rather than a generated blob: the tree
 * IS the design, so editing a dimension in tree.json and re-running rebuilds the
 * model without asking a model anything.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { CadPipeline, type CadRunResult } from "../lib/cad_pipeline.js";
import { createLLMProvider, type LLMProviderType } from "../lib/llm.js";
import { loadTree } from "../lib/artifacts.js";
import { loadKernel } from "../lib/kernel.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import { lintFeatureTree } from "../lib/validators/design_intent.js";
import { validateGeometry } from "../lib/validators/geometric.js";
import { executeInSandbox } from "../lib/stages/review.js";
import { exportShape, type ExportFormat, type ExportResult } from "../lib/export.js";
import type { SilhouetteMode } from "../lib/cad/image.js";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

interface CLIArgs {
  imagePath?: string;
  treePath?: string;
  objectName?: string;
  industry?: string;
  workDir?: string;
  outDir?: string;
  llmType: LLMProviderType;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  silhouetteMode?: SilhouetteMode;
  exportFormats: ExportFormat[];
  stlDeflection?: number;
  noWasm: boolean;
  noAssociativity: boolean;
  noVision: boolean;
  json: boolean;
  verbose: boolean;
  help: boolean;
}

const USAGE = `
topo-img2cad — AI-driven parametric CAD model generation from images

Usage:
  topo-img2cad <image.png> [options]           image → feature tree → code → measured review
  topo-img2cad --tree <tree.json> [options]    rebuild a saved tree, no model involved

Options:
  --object <name>      What the part is; steers the feature tree
  --industry <text>    Domain vocabulary / typical construction for this industry
  --industry-file <f>  Same, read from a file
  --tree <path>        Rebuild from a saved feature tree instead of calling a model
  --out, -o <dir>      Where to write the artifacts (default: next to the image)
  --llm <type>         openai | anthropic | mock (default: openai)
  --model <name>       Model name
  --api-key <key>      API key (or OPENAI_API_KEY / ANTHROPIC_API_KEY)
  --base-url <url>     API base URL
  --silhouette <mode>  ink | region | auto (default: auto)
  --export <list>      step, stl (default: both); "none" writes neither
  --no-export          Skip writing STEP and STL
  --stl-deflection <n> STL chord tolerance in mm (default: 0.1; smaller = finer)
  --no-wasm            Generate code only; skip every measured gate
  --no-associativity   Skip the per-parameter rebuild check
  --no-vision          Read profiles from the model's prose, not the image crop
  --json               Print the full result as JSON on stdout (progress goes to stderr)
  --verbose, -v        Progress on stderr
  --help, -h           This text

Exit code is 1 when the review fails, so it can gate a script.
`;

function parseFormats(raw: string): ExportFormat[] {
  const wanted = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (wanted.length === 0 || wanted.includes("none")) return [];

  const formats: ExportFormat[] = [];
  for (const w of wanted) {
    const format = w === "step" || w === "stp" ? "step" : w === "stl" ? "stl" : null;
    if (!format) throw new Error(`unknown export format "${w}" — expected step or stl`);
    if (!formats.includes(format)) formats.push(format);
  }
  return formats;
}

function parseArgs(argv: string[]): CLIArgs {
  const args: CLIArgs = {
    llmType: "openai",
    exportFormats: ["step", "stl"],
    noWasm: false,
    noAssociativity: false,
    noVision: false,
    json: false,
    verbose: false,
    help: false,
  };

  const positional: string[] = [];
  const value = (i: number, flag: string): string => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) {
      throw new Error(`${flag} needs a value`);
    }
    return v;
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--object":
        args.objectName = value(i, arg);
        i++;
        break;
      case "--industry":
        args.industry = value(i, arg);
        i++;
        break;
      case "--industry-file":
        args.industry = readFileSync(resolve(value(i, arg)), "utf-8").trim();
        i++;
        break;
      case "--tree":
        args.treePath = value(i, arg);
        i++;
        break;
      case "--out":
      case "-o":
        args.outDir = value(i, arg);
        i++;
        break;
      case "--llm":
        args.llmType = value(i, arg) as LLMProviderType;
        i++;
        break;
      case "--model":
        args.model = value(i, arg);
        i++;
        break;
      case "--api-key":
        args.apiKey = value(i, arg);
        i++;
        break;
      case "--base-url":
        args.baseUrl = value(i, arg);
        i++;
        break;
      case "--silhouette":
        args.silhouetteMode = value(i, arg) as SilhouetteMode;
        i++;
        break;
      case "--export":
        args.exportFormats = parseFormats(value(i, arg));
        i++;
        break;
      case "--no-export":
        args.exportFormats = [];
        break;
      case "--stl-deflection":
        args.stlDeflection = Number(value(i, arg));
        if (!isFinite(args.stlDeflection) || args.stlDeflection <= 0) {
          throw new Error("--stl-deflection must be a positive number");
        }
        i++;
        break;
      case "--no-wasm":
        args.noWasm = true;
        break;
      case "--no-associativity":
        args.noAssociativity = true;
        break;
      case "--no-vision":
        args.noVision = true;
        break;
      case "--json":
        args.json = true;
        break;
      case "--verbose":
      case "-v":
        args.verbose = true;
        break;
      default:
        positional.push(arg);
        break;
    }
  }

  if (positional.length > 0) {
    args.imagePath = positional[0];
  }
  return args;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function reportResult(result: CadRunResult): boolean {
  console.log(`\nfeature tree   ${result.tree.name} — ${result.tree.features.length} feature(s), ${Object.keys(result.tree.sketches).length} sketch(es)`);
  console.log(`parameters     ${Object.entries(result.resolved).map(([k, v]) => `${k}=${v}`).join(", ") || "(none)"}`);
  console.log(`code           ${result.code.source.split("\n").length} lines, methods: ${result.code.methodsUsed.join(", ")}`);

  if (result.warnings.length > 0) {
    console.log(`\nwarnings (${result.warnings.length}):`);
    for (const w of result.warnings) console.log(`  ! ${w}`);
  }
  if (result.errors.length > 0) {
    console.log(`\nERRORS (${result.errors.length}):`);
    for (const e of result.errors) console.log(`  x ${e}`);
  }

  const review = result.review;
  if (!review) {
    console.log(`\nreview         not run (no kernel) — the code is emitted but unverified`);
    return result.errors.length === 0;
  }

  const g = review.geometry;
  if (g) {
    console.log(
      `\ngeometry       valid=${g.shapeValid} volume=${fmt(g.volume)} area=${fmt(g.surfaceArea)} faces=${g.faceCount ?? "?"}${g.bbox ? ` bbox=${g.bbox.map((n) => n.toFixed(2)).join(", ")}` : ""}`,
    );
  }
  if (review.solves) {
    for (const [id, s] of Object.entries(review.solves.reports)) {
      console.log(`solver ${id.padEnd(8)} status=${s.status} cost=${fmt(s.cost)} dof=${s.dofCount}`);
    }
  }
  if (review.reprojection) {
    console.log(`re-projection  compared=${review.reprojection.compared}`);
    for (const v of review.reprojection.views) {
      console.log(
        `  ${v.view.padEnd(7)} iou=${v.iou.toFixed(4)} recall=${v.recall.toFixed(3)} precision=${v.precision.toFixed(3)} dev=${v.deviation.modelToReference.toFixed(2)}px [${v.registration ?? "absolute"}]`,
      );
    }
  }
  if (result.associativity) {
    const inert = result.associativity.checks.filter((c) => !c.droveGeometry);
    console.log(
      `associativity  ${result.associativity.checks.length} parameter(s) checked, ${inert.length} inert${inert.length ? `: ${inert.map((c) => c.parameter).join(", ")}` : ""}`,
    );
  }

  console.log(`\nreview         ${review.passed ? "PASSED" : "FAILED"} (${review.issues.length} issue(s), ${result.refinements} refinement(s))`);
  for (const issue of review.issues) {
    console.log(`  [${issue.severity}] ${issue.code ?? "-"} ${issue.message}`);
    if (issue.suggestion) console.log(`        → ${issue.suggestion}`);
  }
  reportExports(result.exports, review.passed);

  if (result.artifacts) {
    console.log(`\nartifacts      ${result.artifacts.dir}/`);
  }
  console.log(`               edit a dimension in tree.json and re-run with --tree to rebuild`);
  return review.passed && result.errors.length === 0;
}

function reportExports(exports: ExportResult | undefined, verified: boolean): void {
  if (!exports) return;

  if (exports.files.length > 0) {
    console.log(`\ndeliverables`);
    for (const file of exports.files) {
      const detail = Object.entries(file.detail)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ");
      console.log(`  ${file.format.toUpperCase().padEnd(5)} ${file.path}  (${formatBytes(file.bytes)}${detail ? `, ${detail}` : ""})`);
    }
    // A file looks equally authoritative whether or not the model held up, so
    // say which one this is rather than leaving it to be discovered downstream.
    if (!verified) {
      console.log(`  note: the model did not pass its gates — these files are for inspection, not for use`);
    }
  }
  for (const failure of exports.failures) {
    console.log(`  ${failure.format.toUpperCase()} FAILED  ${failure.reason}`);
  }
  for (const note of exports.notes) {
    console.log(`  note: ${note}`);
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmt(v: number | undefined): string {
  if (v === undefined) return "?";
  return Number.isFinite(v) ? v.toFixed(3) : String(v);
}

/**
 * Send the kernel's own output to stderr.
 *
 * STEP export prints a transfer report from C++ to stdout. Mixed into stdout it
 * would sit inside `--json`, so stdout stays the machine-readable channel and the
 * kernel talks on stderr.
 */
function writeKernelOutput(_stream: "out" | "err", text: string): void {
  process.stderr.write(text.endsWith("\n") ? text : `${text}\n`);
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

async function rebuildFromTree(args: CLIArgs): Promise<number> {
  const treePath = resolve(args.treePath!);
  const tree = loadTree(treePath);
  const outDir = resolve(args.outDir ?? dirname(treePath));
  mkdirSync(outDir, { recursive: true });

  const lint = lintFeatureTree(tree);
  const build = runBuildFromTree(tree);

  if (!args.json) {
    console.log(`img2cad — rebuild from tree`);
    console.log(`tree           ${treePath}`);
    console.log(`lint           ${lint.passed ? "passed" : `FAILED (${lint.issues.filter((i) => i.severity === "error").length} error(s))`}`);
    for (const issue of lint.issues) {
      console.log(`  [${issue.severity}] ${issue.code} ${issue.message}`);
    }
  }

  const modelPath = join(outDir, "model.ts");
  writeFileSync(modelPath, `${build.code.source}\n`, "utf-8");

  if (args.noWasm) {
    if (!args.json) {
      console.log(`\nmodel.ts       ${modelPath} (no kernel: unverified)`);
    } else {
      console.log(JSON.stringify({
        tree: treePath,
        name: tree.name,
        resolved: build.resolved,
        lint,
        geometry: null,
        exports: null,
        model: modelPath,
        passed: lint.passed && build.errors.length === 0,
        verified: false,
      }, null, 2));
    }
    return lint.passed && build.errors.length === 0 ? 0 : 1;
  }

  // loadKernel registers the embind globals the workplane bindings resolve.
  const kernel = await loadKernel({ onKernelOutput: writeKernelOutput });
  const sandbox = executeInSandbox(build.code.source, kernel.tp, kernel.CQWorkplane, undefined, undefined, undefined);

  if (sandbox.error) {
    if (args.json) {
      console.log(JSON.stringify({
        tree: treePath,
        name: tree.name,
        resolved: build.resolved,
        lint,
        geometry: null,
        error: sandbox.error,
        stack: sandbox.stack,
        model: modelPath,
        passed: false,
        verified: true,
      }, null, 2));
    } else {
      console.error(`\nexecution failed: ${sandbox.error}`);
    }
    return 1;
  }

  const geo = validateGeometry(kernel.tp, sandbox.shape);
  const ok = lint.passed && geo.report.shapeValid && !geo.issues.some((i) => i.severity === "error");

  let exports: ExportResult | undefined;
  if (args.exportFormats.length > 0) {
    exports = exportShape(kernel.tp, sandbox.shape, {
      outDir,
      basename: tree.name,
      formats: args.exportFormats,
      stlDeflection: args.stlDeflection,
    });
  }

  if (args.json) {
    // The kernel's own chatter is suppressed above so this stays the only thing
    // on stdout.
    console.log(JSON.stringify({
      tree: treePath,
      name: tree.name,
      resolved: build.resolved,
      lint,
      geometry: geo.report,
      geometryIssues: geo.issues,
      exports: exports ?? null,
      model: modelPath,
      passed: ok,
      verified: true,
    }, null, 2));
    return ok ? 0 : 1;
  }

  console.log(`\ngeometry       valid=${geo.report.shapeValid} volume=${fmt(geo.report.volume)} area=${fmt(geo.report.surfaceArea)} faces=${geo.report.faceCount ?? "?"}`);
  if (geo.report.bbox) {
    const [x0, y0, z0, x1, y1, z1] = geo.report.bbox;
    console.log(`bbox           ${(x1 - x0).toFixed(3)} x ${(y1 - y0).toFixed(3)} x ${(z1 - z0).toFixed(3)}`);
  }
  for (const issue of geo.issues) {
    console.log(`  [${issue.severity}] ${issue.code} ${issue.message}`);
  }

  console.log(`\nreview         ${ok ? "PASSED" : "FAILED"}`);
  reportExports(exports, ok);
  console.log(`model.ts       ${modelPath}`);
  return ok ? 0 : 1;
}

async function runFromImage(args: CLIArgs): Promise<number> {
  const imagePath = resolve(args.imagePath!);
  const outDir = resolve(args.outDir ?? dirname(imagePath));
  mkdirSync(outDir, { recursive: true });

  // Read once, up front: a missing or undecodable image should fail before any
  // model call is paid for.
  readFileSync(imagePath);

  const llm = createLLMProvider(args.llmType, {
    apiKey: args.apiKey,
    model: args.model,
    baseUrl: args.baseUrl,
  });

  let tp: unknown;
  let CQWorkplane: unknown;
  if (!args.noWasm) {
    const kernel = await loadKernel({ onKernelOutput: writeKernelOutput });
    tp = kernel.tp;
    CQWorkplane = kernel.CQWorkplane;
  }

  const pipeline = new CadPipeline({
    llm,
    tp,
    CQWorkplane,
    workDir: outDir,
    silhouetteMode: args.silhouetteMode,
    industry: args.industry,
    visionProfiles: !args.noVision,
    checkAssociativity: !args.noAssociativity,
    exportFormats: args.exportFormats,
    stlDeflection: args.stlDeflection,
    // --json promises stdout carries the result and nothing else.
    verbose: args.verbose && !args.json,
  });

  if (!args.json) {
    console.log(`img2cad — image to parametric CAD`);
    console.log(`image          ${imagePath}`);
    console.log(`model          ${args.llmType}${args.model ? ` / ${args.model}` : ""}`);
    console.log(`kernel         ${args.noWasm ? "not loaded (code only)" : "loaded"}`);
  }

  const result = await pipeline.run(imagePath, args.objectName);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    reportResult(result);
  }

  const passed = args.noWasm
    ? result.errors.length === 0
    : (result.review?.passed ?? false) && result.errors.length === 0;
  return passed ? 0 : 1;
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help || (!args.imagePath && !args.treePath)) {
    console.log(USAGE);
    process.exit(args.help ? 0 : 1);
  }

  const code = args.treePath ? await rebuildFromTree(args) : await runFromImage(args);
  process.exit(code);
}

main().catch((e) => {
  console.error(`\nfatal: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
