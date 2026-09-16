/**
 * Persisting what the pipeline produced.
 *
 * The feature tree IS the design — the code is a rendering of it. So the tree is
 * what gets written: it is the artifact a person edits to change a dimension, and
 * the CLI can rebuild from it without calling a model again. Writing only the
 * emitted code would throw away the only editable form of the design.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { GeneratedCode } from "./types.js";
import type { FeatureTree } from "./cad/model.js";
import type { ViewReference } from "./cad/reference.js";
import { encodePngGray, maskToRaster } from "./cad/image_encode.js";
import type { CadReviewOutcome } from "./cad_pipeline.js";

export interface ArtifactPaths {
  dir: string;
  tree: string;
  code: string;
  review?: string;
  /** Reference silhouettes written out, one PNG per view. */
  reference: string[];
}

export interface SaveArtifactOptions {
  workDir: string;
  tree: FeatureTree;
  code: GeneratedCode;
  review?: CadReviewOutcome;
  /**
   * The silhouettes the model was measured against.
   *
   * Written out because the re-projection gate is the one verdict a reader
   * cannot check by looking at the code: when it fails, seeing exactly which
   * pixels the model was compared to is the difference between a bug report and
   * a fix.
   */
  references?: ViewReference[];
}

export const ARTIFACT_DIR = ".topo-img2cad";

/** Write the feature tree, the emitted code and the review outcome. */
export function saveArtifacts(opts: SaveArtifactOptions): ArtifactPaths {
  const dir = join(opts.workDir, ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  const treePath = join(dir, "tree.json");
  const codePath = join(dir, "model.ts");

  writeFileSync(treePath, `${JSON.stringify(opts.tree, null, 2)}\n`, "utf-8");
  writeFileSync(codePath, `${opts.code.source}\n`, "utf-8");

  const paths: ArtifactPaths = { dir, tree: treePath, code: codePath, reference: [] };

  if (opts.review) {
    const reviewPath = join(dir, "review.json");
    writeFileSync(reviewPath, `${JSON.stringify(summarize(opts.review), null, 2)}\n`, "utf-8");
    paths.review = reviewPath;
  }

  if (opts.references && opts.references.length > 0) {
    const refDir = join(dir, "reference");
    mkdirSync(refDir, { recursive: true });
    for (const ref of opts.references) {
      // A drawing with no usable silhouette has no mask to write; its ink is the
      // evidence and it is written instead, so the gate's input can be looked at.
      const raster =
        ref.maskWidth > 0 && ref.maskHeight > 0
          ? maskToRaster(ref.mask, ref.maskWidth, ref.maskHeight)
          : maskToRaster(ref.ink, ref.inkWidth, ref.inkHeight);
      const pngPath = join(refDir, `${ref.viewId}.png`);
      writeFileSync(pngPath, encodePngGray(raster));
      paths.reference.push(pngPath);
    }
  }

  return paths;
}

/** Read back a feature tree written by `saveArtifacts`. */
export function loadTree(path: string): FeatureTree {
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`${path} does not contain a feature tree object`);
  }
  const tree = parsed as FeatureTree;
  if (!tree.features || !tree.sketches) {
    throw new Error(`${path} is not a feature tree: it has no "features" and "sketches"`);
  }
  return tree;
}

function summarize(review: CadReviewOutcome): unknown {
  return {
    passed: review.passed,
    geometry: review.geometry,
    solves: review.solves
      ? Object.fromEntries(
          Object.entries(review.solves.reports).map(([id, r]) => [
            id,
            { status: r.status, cost: r.cost, dof: r.dofCount },
          ]),
        )
      : undefined,
    reprojection: review.reprojection
      ? {
          compared: review.reprojection.compared,
          passed: review.reprojection.passed,
          consistency: review.reprojection.consistency,
          views: review.reprojection.views.map((v) => ({
            view: v.view,
            registration: v.registration,
            iou: round(v.iou),
            recall: round(v.recall),
            precision: round(v.precision),
            deviationPx: round(v.deviation.modelToReference),
          })),
        }
      : undefined,
    edgeDistance: review.edgeDistance?.map((e) => ({
      compared: e.compared,
      passed: e.passed,
      meanPx: round(e.meanPx),
      medianPx: round(e.medianPx),
      p90Px: round(e.p90Px),
      maxPx: round(e.maxPx),
      meanFraction: round(e.meanFraction),
      meanRatio: round(e.meanRatio),
      baselinePx: round(e.baselinePx),
      outlinePixels: e.outlinePixels,
      registration: e.registration
        ? {
            scale: round(e.registration.scale),
            shiftXPx: round(e.registration.shiftXPx),
            shiftYPx: round(e.registration.shiftYPx),
            movedFraction: round(e.registration.movedFraction),
          }
        : undefined,
    })),
    skippedFeatures: review.skippedFeatures,
    issues: review.issues,
  };
}

function round(v: number): number {
  return Number.isFinite(v) ? Number(v.toFixed(4)) : v;
}
