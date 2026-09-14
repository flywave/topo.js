#!/usr/bin/env node

/**
 * topo-img2cad CLI — entry point for the AI-driven parametric CAD pipeline.
 *
 * Usage:
 *   topo-img2cad <image-path> [options]
 *   topo-img2cad --state <work-dir> --next
 *   topo-img2cad --state <work-dir> --status
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Pipeline } from "../lib/pipeline.js";
import { createLLMProvider } from "../lib/llm.js";
import { initState, loadState, statusSummary } from "../lib/state.js";
import type { PipelineConfig } from "../lib/types.js";
import type { LLMProviderType } from "../lib/llm.js";

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

interface CLIArgs {
  /** Image path */
  imagePath?: string;
  /** Work directory for state files */
  workDir?: string;
  /** LLM provider type */
  llmType: LLMProviderType;
  /** LLM model name */
  model?: string;
  /** LLM API key */
  apiKey?: string;
  /** LLM base URL */
  baseUrl?: string;
  /** Profile */
  profile: string;
  /** Verbose output */
  verbose: boolean;
  /** Show status only */
  statusOnly: boolean;
  /** Run next step only */
  nextOnly: boolean;
  /** Show help */
  help: boolean;
}

function parseArgs(argv: string[]): CLIArgs {
  const args: CLIArgs = {
    llmType: "openai",
    profile: "generic",
    verbose: false,
    statusOnly: false,
    nextOnly: false,
    help: false,
  };

  const positional: string[] = [];

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--verbose":
      case "-v":
        args.verbose = true;
        break;
      case "--status":
        args.statusOnly = true;
        break;
      case "--next":
        args.nextOnly = true;
        break;
      case "--llm":
        args.llmType = argv[++i] as LLMProviderType;
        break;
      case "--model":
        args.model = argv[++i];
        break;
      case "--api-key":
        args.apiKey = argv[++i];
        break;
      case "--base-url":
        args.baseUrl = argv[++i];
        break;
      case "--work-dir":
      case "-d":
        args.workDir = argv[++i];
        break;
      case "--profile":
      case "-p":
        args.profile = argv[++i];
        break;
      default:
        positional.push(arg);
        break;
    }
  }

  if (positional.length > 0) {
    args.imagePath = positional[0];
  }

  // Default work dir from image path
  if (!args.workDir && args.imagePath) {
    args.workDir = dirname(resolve(args.imagePath));
  }
  if (!args.workDir) {
    args.workDir = process.cwd();
  }

  return args;
}

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

function printHelp(): void {
  console.log(`
topo-img2cad — AI-driven parametric CAD model generation from images

Usage:
  topo-img2cad <image-path> [options]     Generate CAD model from image
  topo-img2cad --status                   Show current pipeline status
  topo-img2cad --next                     Run next pipeline step

Options:
  --llm <type>        LLM provider: openai, anthropic, mock (default: openai)
  --model <name>      LLM model name (default: gpt-4o / claude-sonnet-4-20250514)
  --api-key <key>     LLM API key (or set OPENAI_API_KEY / ANTHROPIC_API_KEY)
  --base-url <url>    LLM API base URL
  --work-dir, -d <dir> Working directory for state files
  --profile, -p <name> Domain profile: generic, mechanical, architectural
  --verbose, -v       Enable verbose output
  --help, -h          Show this help

Examples:
  topo-img2cad photo.png
  topo-img2cad photo.png --llm anthropic --model claude-sonnet-4-20250514
  topo-img2cad --status -d ./my-project
  topo-img2cad --next -d ./my-project
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Status mode
  if (args.statusOnly) {
    try {
      const state = loadState(args.workDir!);
      console.log(statusSummary(state));
      console.log("\nCompleted steps:");
      for (const [id, step] of Object.entries(state.completedSteps)) {
        const icon = step.status === "completed" ? "✓" : step.status === "skipped" ? "○" : "✗";
        console.log(`  ${icon} ${id}${step.evidence ? ` (${step.evidence})` : ""}`);
      }
    } catch (e) {
      console.error("No pipeline state found. Run with an image path first.");
      process.exit(1);
    }
    return;
  }

  // Next step mode
  if (args.nextOnly) {
    const config = createConfig(args);
    const pipeline = new Pipeline(config);
    await pipeline.resume();
    return;
  }

  // Full run mode
  if (!args.imagePath) {
    console.error("Error: image path is required");
    printHelp();
    process.exit(1);
  }

  const imagePath = resolve(args.imagePath);
  const config = createConfig(args);
  const pipeline = new Pipeline(config);

  // Event listener
  pipeline.on((event) => {
    const icon =
      event.type === "stage_start" ? "▶" :
      event.type === "stage_complete" ? "✓" :
      event.type === "stage_error" ? "✗" :
      event.type === "complete" ? "★" :
      event.type === "failed" ? "✗" : "•";
    console.log(`${icon} [${event.stage}] ${event.message}`);
  });

  console.log(`\nimg2cad — AI-driven parametric CAD generation`);
  console.log(`Image: ${imagePath}`);
  console.log(`LLM: ${args.llmType}`);
  console.log(`Work dir: ${config.workDir}`);
  console.log("");

  const finalState = await pipeline.run(imagePath);

  console.log("\n--- Final Status ---");
  console.log(statusSummary(finalState));

  if (finalState.code) {
    const outPath = resolve(config.workDir, "generated_model.ts");
    const fs = await import("fs");
    fs.writeFileSync(outPath, finalState.code.source, "utf-8");
    console.log(`\nGenerated code written to: ${outPath}`);
  }
}

function createConfig(args: CLIArgs): PipelineConfig {
  const llm = createLLMProvider(args.llmType, {
    apiKey: args.apiKey,
    model: args.model,
    baseUrl: args.baseUrl,
  });

  return {
    llm,
    workDir: args.workDir!,
    validateGeometry: true,
    compareRender: false,
    maxCorrectionsPerStage: 3,
    maxTotalCorrections: 6,
    verbose: args.verbose,
  };
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
