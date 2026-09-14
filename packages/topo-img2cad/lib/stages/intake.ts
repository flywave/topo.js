/**
 * Stage 1: INTAKE — Image analysis and suitability gating
 *
 * Analyzes a reference image to extract geometric information for
 * parametric CAD reconstruction. Uses AI vision models for content
 * understanding and deterministic scripts for metadata extraction.
 */

import { readFileSync } from "fs";
import type { LLMProvider, ImageAnalysis } from "../types.js";
import { buildIntakeAnalysisPrompt, parseIntakeResponse } from "../prompts/intake_analysis.js";
import { INTAKE_ANALYSIS_SYSTEM } from "../prompts/intake_analysis.js";

// ---------------------------------------------------------------------------
// Image probing (deterministic, no AI)
// ---------------------------------------------------------------------------

export interface ImageProbe {
  /** Image file path */
  path: string;
  /** Image dimensions [width, height] in pixels */
  dimensions: [number, number];
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string;
  /** Whether the image is large enough for analysis */
  suitableSize: boolean;
}

/** Probe image metadata without AI. */
export function probeImage(imagePath: string): ImageProbe {
  const data = readFileSync(imagePath);
  const probe: ImageProbe = {
    path: imagePath,
    dimensions: [0, 0],
    fileSize: data.length,
    mimeType: "image/png",
    suitableSize: data.length > 1000, // At least 1KB
  };

  // Detect dimensions from PNG/JPEG headers
  if (data[0] === 0x89 && data[1] === 0x50) {
    // PNG
    probe.mimeType = "image/png";
    if (data.length > 24) {
      probe.dimensions = [
        data.readUInt32BE(16),
        data.readUInt32BE(20),
      ];
    }
  } else if (data[0] === 0xff && data[1] === 0xd8) {
    // JPEG
    probe.mimeType = "image/jpeg";
    // JPEG dimensions require scanning markers — simplified check
    probe.suitableSize = data.length > 5000;
  }

  // Check minimum resolution
  if (probe.dimensions[0] > 0 && probe.dimensions[1] > 0) {
    const minDim = Math.min(probe.dimensions[0], probe.dimensions[1]);
    if (minDim < 256) {
      probe.suitableSize = false;
    }
  }

  return probe;
}

// ---------------------------------------------------------------------------
// Suitability gate (deterministic)
// ---------------------------------------------------------------------------

export interface SuitabilityGate {
  passed: boolean;
  reasons: string[];
}

/** Check if the image meets minimum requirements for CAD reconstruction. */
export function checkSuitability(probe: ImageProbe): SuitabilityGate {
  const reasons: string[] = [];

  if (!probe.suitableSize) {
    reasons.push(`Image too small (${probe.fileSize} bytes, minimum 1KB)`);
  }
  if (probe.dimensions[0] > 0 && probe.dimensions[0] < 256) {
    reasons.push(`Width too small (${probe.dimensions[0]}px, minimum 256px)`);
  }
  if (probe.dimensions[1] > 0 && probe.dimensions[1] < 256) {
    reasons.push(`Height too small (${probe.dimensions[1]}px, minimum 256px)`);
  }
  if (!probe.mimeType.startsWith("image/")) {
    reasons.push(`Not an image file (detected: ${probe.mimeType})`);
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// AI-powered image analysis
// ---------------------------------------------------------------------------

/**
 * Run full intake analysis on an image.
 *
 * Steps:
 * 1. Probe image metadata (deterministic)
 * 2. Check suitability gate (deterministic)
 * 3. Send to AI for geometric analysis
 * 4. Parse and validate AI response
 */
export async function runIntake(
  imagePath: string,
  llm: LLMProvider,
  opts?: { profile?: string; context?: string },
): Promise<ImageAnalysis> {
  // Step 1: Probe
  const probe = probeImage(imagePath);

  // Step 2: Suitability gate
  const gate = checkSuitability(probe);
  if (!gate.passed) {
    return {
      suitable: false,
      unsuitableReason: gate.reasons.join("; "),
      complexity: "simple",
      confidence: 0,
      detectedPrimitives: [],
      materials: [],
      componentCount: 0,
      identityFeatures: [],
      hiddenAspects: [],
    };
  }

  // Step 3: AI analysis
  const imageBuffer = readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");

  const prompt = buildIntakeAnalysisPrompt(opts);
  const rawResponse = await llm.analyzeImage(imageBase64, prompt);

  // Step 4: Parse response
  const parsed = parseIntakeResponse(rawResponse);

  // Coerce into ImageAnalysis shape (with defaults)
  const analysis: ImageAnalysis = {
    suitable: Boolean(parsed.suitable ?? true),
    unsuitableReason: parsed.unsuitableReason as string | undefined,
    complexity: (parsed.complexity as ImageAnalysis["complexity"]) ?? "moderate",
    confidence: Number(parsed.confidence) || 0.5,
    detectedPrimitives: Array.isArray(parsed.detectedPrimitives) ? parsed.detectedPrimitives as ImageAnalysis["detectedPrimitives"] : [],
    estimatedDimensions: Array.isArray(parsed.estimatedDimensions) ? parsed.estimatedDimensions as [number, number, number] : undefined,
    materials: Array.isArray(parsed.materials) ? parsed.materials as ImageAnalysis["materials"] : [],
    componentCount: Number(parsed.componentCount) || 0,
    identityFeatures: Array.isArray(parsed.identityFeatures) ? parsed.identityFeatures as string[] : [],
    hiddenAspects: Array.isArray(parsed.hiddenAspects) ? parsed.hiddenAspects as string[] : [],
  };

  return analysis;
}
