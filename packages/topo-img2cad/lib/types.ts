// ---------------------------------------------------------------------------
// Core types for img2cad pipeline
// ---------------------------------------------------------------------------

// ---- Geometry primitives recognized by the system ----

export type GeometricPrimitiveType =
  | "box"
  | "cylinder"
  | "cone"
  | "sphere"
  | "torus"
  | "wedge"
  | "revolve"
  | "extrude"
  | "sweep"
  | "loft"
  | "pipe"
  | "fillet"
  | "chamfer"
  | "boolean_cut"
  | "boolean_union"
  | "boolean_intersect"
  | "hole"
  | "shell"
  | "sketch"
  | "assembly";

// ---- Stage 1: Image Analysis ----

export interface ImageAnalysis {
  /** Whether the image is suitable for 3D CAD reconstruction */
  suitable: boolean;
  /** Reason if not suitable */
  unsuitableReason?: string;
  /** Overall complexity rating */
  complexity: "simple" | "moderate" | "complex" | "ultra-complex";
  /** Confidence in analysis (0-1) */
  confidence: number;
  /** Detected geometric primitives in the image */
  detectedPrimitives: DetectedPrimitive[];
  /** Estimated overall dimensions [length, width, height] in mm */
  estimatedDimensions?: [number, number, number];
  /** Material/finish observations */
  materials: MaterialObservation[];
  /** Number of distinct components detected */
  componentCount: number;
  /** Key features that define the object's identity */
  identityFeatures: string[];
  /** What the single view cannot reveal */
  hiddenAspects: string[];
}

export interface DetectedPrimitive {
  type: GeometricPrimitiveType;
  /** Confidence this primitive exists (0-1) */
  confidence: number;
  /** Approximate position in image (normalized 0-1) */
  position?: { x: number; y: number };
  /** Estimated dimensions */
  dimensions?: Record<string, number>;
  /** Relationships to other primitives */
  relationships?: PrimitiveRelationship[];
}

export interface PrimitiveRelationship {
  kind: "attached_to" | "cuts_into" | "sits_on" | "aligned_with" | "concentric_with";
  targetIndex: number;
}

export interface MaterialObservation {
  /** Region description */
  region: string;
  /** PBR-like material classification */
  finish: "matte" | "glossy" | "metallic" | "transparent" | "textured";
  /** RGB color estimate */
  color?: [number, number, number];
}

// ---- Stage 2: Parametric Spec ----

export interface ParametricSpec {
  /** Human-readable name */
  name: string;
  /** Source image path (if any) */
  sourceImage?: string;
  /** Overall description */
  description: string;
  /** Components to build */
  components: ParametricComponent[];
  /** Assembly hierarchy and constraints */
  assembly?: AssemblySpec;
  /** Global parameters that can be varied */
  parameters: ParameterDefinition[];
}

export interface ParametricComponent {
  /** Unique name within the spec */
  name: string;
  /** Which CQWorkplane / primitive method to use */
  type: GeometricPrimitiveType;
  /** Method-specific parameters */
  params: Record<string, number | string | number[]>;
  /** Location transform (12-element row-major matrix) */
  location?: number[];
  /** Color [r, g, b] (0-1 range) */
  color?: [number, number, number];
  /** Boolean operations to apply with other components */
  booleans?: BooleanOp[];
  /** Children for compound components */
  children?: ParametricComponent[];
}

export interface BooleanOp {
  kind: "cut" | "union" | "intersect";
  /** Name of the target component */
  target: string;
}

export interface AssemblySpec {
  /** Parent-child hierarchy (names) */
  hierarchy: string[];
  /** Assembly constraints */
  constraints: AssemblyConstraint[];
}

export interface AssemblyConstraint {
  kind: "plane_coincident" | "axis_align" | "point_coincident" | "distance" | "angle";
  /** Component names involved */
  refs: [string, string];
  /** Constraint value (for distance/angle) */
  value?: number;
}

export interface ParameterDefinition {
  /** Parameter name */
  name: string;
  /** Default value */
  default: number;
  /** Min value */
  min?: number;
  /** Max value */
  max?: number;
  /** Description */
  description?: string;
}

// ---- Stage 3: Generated Code ----

export interface GeneratedCode {
  /** The generated TypeScript source code */
  source: string;
  /** Entry point function name */
  entryPoint: string;
  /** Required imports */
  imports: string[];
  /** Optional: parametric builder registration code */
  parametricBuilder?: string;
  /** Which CQWorkplane methods were used */
  methodsUsed: string[];
}

// ---- Stage 4: Review / Validation ----

export interface GeometryReport {
  /** Whether the shape is non-null */
  shapeValid: boolean;
  /** Bounding box [minX, minY, minZ, maxX, maxY, maxZ] */
  bbox?: [number, number, number, number, number, number];
  /** Volume (>0 for solids) */
  volume?: number;
  /** Surface area */
  surfaceArea?: number;
  /** Whether the solid is watertight */
  isWaterproof?: boolean;
  /** Number of faces */
  faceCount?: number;
  /** Number of edges */
  edgeCount?: number;
  /** Number of vertices */
  vertexCount?: number;
}

export interface ReviewResult {
  /** Whether all checks passed */
  passed: boolean;
  /** Geometry validation results */
  geometry: GeometryReport;
  /** Execution time in ms */
  executionTime: number;
  /** Any issues found */
  issues: ReviewIssue[];
  /** Sandbox execution output */
  sandboxOutput: SandboxOutput;
}

export interface ReviewIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  /** Suggestion for fixing */
  suggestion?: string;
}

export interface SandboxOutput {
  /** Console logs from execution */
  logs: string[];
  /** Warnings */
  warnings: string[];
  /** Error message if execution failed */
  error?: string;
  /** Stack trace if error */
  stack?: string;
}

// ---- Stage 5: Refinement ----

export interface RefinementResult {
  /** The corrected code */
  correctedCode: string;
  /** What was changed */
  changes: string[];
  /** Whether this is the final attempt */
  isFinalAttempt: boolean;
}

// ---- Pipeline State ----

export type PipelineStage =
  | "idle"
  | "intake"
  | "spec"
  | "build"
  | "review"
  | "refine"
  | "complete"
  | "failed";

export interface PipelineState {
  /** Current stage */
  stage: PipelineStage;
  /** Reference image path */
  referenceImage?: string;
  /** Profile: generic | mechanical | architectural | custom */
  profile: string;
  /** Step completion map */
  completedSteps: Record<string, StepResult>;
  /** Current correction loop count */
  correctionCount: number;
  /** Max corrections per stage */
  maxCorrectionsPerStage: number;
  /** Max total corrections */
  maxTotalCorrections: number;
  /** Accumulated outputs from each stage */
  analysis?: ImageAnalysis;
  spec?: ParametricSpec;
  code?: GeneratedCode;
  review?: ReviewResult;
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

export interface StepResult {
  stepId: string;
  status: "completed" | "skipped" | "failed";
  evidence?: string;
  skippedReason?: string;
  error?: string;
}

// ---- LLM Provider ----

export interface LLMProvider {
  /** Analyze an image and return structured analysis */
  analyzeImage(imageBase64: string, prompt: string): Promise<string>;
  /** Generate text completion */
  complete(prompt: string, systemPrompt?: string): Promise<string>;
  /** Provider name for logging */
  readonly name: string;
}

// ---- Pipeline Configuration ----

export interface PipelineConfig {
  /** LLM provider to use */
  llm: LLMProvider;
  /** Working directory for state files */
  workDir: string;
  /** Whether to run geometric validation */
  validateGeometry: boolean;
  /** Whether to run render comparison */
  compareRender: boolean;
  /** Max correction loops per stage (default: 3) */
  maxCorrectionsPerStage: number;
  /** Max total correction loops (default: 6) */
  maxTotalCorrections: number;
  /** Verbose logging */
  verbose: boolean;
}

// ---- Code Generation Context ----

export interface CodeContext {
  /** Available CQWorkplane methods */
  availableMethods: string[];
  /** Available BasePrimitive types */
  availablePrimitives: string[];
  /** Examples of generated code for similar shapes */
  examples: string[];
  /** The original image analysis */
  analysis?: ImageAnalysis;
  /** The parametric spec */
  spec?: ParametricSpec;
  /** Previous code attempt (for refinement) */
  previousCode?: string;
  /** Previous review issues (for refinement) */
  previousIssues?: ReviewIssue[];
}
