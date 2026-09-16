/**
 * topo-img2cad — AI-driven parametric CAD model generation from images.
 *
 * The model is CAD-shaped, not mesh-shaped: images become views, views become
 * constrained sketches, sketches become an ordered feature tree, and the tree
 * is replayed as topo.js code. Validation is measured (silhouette re-projection,
 * solver residual, associativity), not judged.
 */

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
export { Pipeline } from "./pipeline.js";
export type { PipelineEvent, PipelineListener } from "./pipeline.js";

export { CadPipeline } from "./cad_pipeline.js";
export type { CadPipelineConfig, CadReviewOutcome, CadRunResult } from "./cad_pipeline.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export {
  initState,
  loadState,
  saveState,
  advanceStage,
  setStage,
  markStep,
  skipStep,
  failStep,
  storeAnalysis,
  storeSpec,
  storeCode,
  storeReview,
  incrementCorrection,
  remainingCorrections,
  statusSummary,
} from "./state.js";

// ---------------------------------------------------------------------------
// LLM providers
// ---------------------------------------------------------------------------
export {
  OpenAIProvider,
  AnthropicProvider,
  MockProvider,
  createLLMProvider,
} from "./llm.js";
export type { LLMProviderType, OpenAIProviderOptions } from "./llm.js";

// ---------------------------------------------------------------------------
// CAD model — the feature-based document
// ---------------------------------------------------------------------------
export {
  MILLIMETER,
  makeUnitSystem,
  toMillimeters,
  activeFeatures,
  referencedParameters,
} from "./cad/model.js";
export type {
  LengthUnit,
  UnitSystem,
  ScaleReference,
  ViewKind,
  DrawingKind,
  ViewSpec,
  ViewSet,
  ProfileEntityType,
  ProfileEntity,
  ProfileRelationKind,
  ProfileRelation,
  ProfileLoop,
  Profile2D,
  ProfileDimension,
  SketchConstraintKind,
  SketchConstraintValue,
  SketchConstraint,
  SketchSpec,
  SketchSolveReport,
  DatumPlane,
  DatumAxis,
  FeatureOp,
  FeatureKind,
  Feature,
  CadParameter,
  DesignIntent,
  FeatureTree,
} from "./cad/model.js";

// ---------------------------------------------------------------------------
// CAD machinery — expressions, profiles, projection, code emission
// ---------------------------------------------------------------------------
export { evaluateExpression, resolveParameters, ExpressionError } from "./cad/expr.js";
export type { ResolvedParameters } from "./cad/expr.js";

export { resolveSketchValues, parametersUsedBySketches } from "./cad/resolve_sketch.js";
export type { ResolvedSketchValues } from "./cad/resolve_sketch.js";

export { reconcileSketch, entryPoint, exitPoint } from "./cad/reconcile.js";
export type { ReconcileReport, ReconcileResult, ReconcileOptions } from "./cad/reconcile.js";

export {
  checkClosure,
  inferRelations,
  validateProfile,
  UNSUPPORTED_RELATIONS,
} from "./cad/profile.js";
export type { ClosureReport, ProfileReport } from "./cad/profile.js";

export {
  viewBasis,
  customBasis,
  isKnownView,
  sketchPlaneForView,
  projectMesh,
  translateProjected,
  unionBounds,
  rasterizeMesh,
  rasterizeLoops,
  compareMasks,
  distanceTransform,
  chamferDistance,
  checkViewConsistency,
} from "./cad/project.js";
export type {
  ViewBasis,
  MeshLike,
  Bounds2D,
  ProjectedMesh,
  RasterOptions,
  MaskComparison,
  ChamferResult,
  ViewConsistency,
} from "./cad/project.js";

export { fitTreeScale, scaleSketch } from "./cad/scale_fit.js";
export type { TreeScaleFit } from "./cad/scale_fit.js";

export {
  classifyProfile,
  emitProfileGeometry,
  mergeConstraints,
  deriveJoinConstraints,
  chainEntities,
  profileToPoints,
  tessellateArc,
  arcThreePoints,
  arcSweep,
  planeTo3D,
  validateRevolveProfile,
  planeNormal,
} from "./cad/sketch_codegen.js";
export type {
  EmittedProfile,
  EmitGeometryOptions,
  ClassifiedProfile,
  CircleProfile,
  LoopProfile,
} from "./cad/sketch_codegen.js";

export { emitFeatureTreeCode } from "./cad/feature_codegen.js";
export type { EmittedModel, EmitModelOptions } from "./cad/feature_codegen.js";

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------
export { runViewIntake, coerceViewSet } from "./stages/views.js";
export type { ViewIntakeResult } from "./stages/views.js";

export {
  runProfileExtraction,
  runFeatureTree,
  runBuildFromTree,
  coerceFeatureTree,
} from "./stages/features.js";
export type {
  ProfileExtractionResult,
  FeatureTreeResult,
  BuildFromTreeResult,
} from "./stages/features.js";

export { runIntake, probeImage, checkSuitability } from "./stages/intake.js";
export type { ImageProbe, SuitabilityGate } from "./stages/intake.js";

export { runSpec, preSpecAssessment, refineSpec } from "./stages/spec.js";
export type { PreSpecAssessment } from "./stages/spec.js";

export { runBuild, tryTemplateCode, buildCodeContext } from "./stages/build.js";

export { runReview, executeInSandbox, prepareScript } from "./stages/review.js";
export type { SandboxResult } from "./stages/review.js";

export { runRefinementLoop, diagnoseIssues, refineCode } from "./stages/refine.js";
export type { DiagnosedIssue, RefinementLoopResult } from "./stages/refine.js";

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------
export {
  reprojectShape,
  reprojectAgainstRaster,
  compareProjection,
  evaluateReprojection,
  getMeshData,
  referenceMask,
  DEFAULT_THRESHOLDS,
} from "./validators/reprojection.js";
export type {
  ReferenceSilhouette,
  ReprojectionOptions,
  ReprojectShapeOptions,
  ReprojectAgainstRasterOptions,
  RasterRegistration,
  ViewReprojectionResult,
  ReprojectionReport,
  ReprojectionThresholds,
} from "./validators/reprojection.js";

// ---------------------------------------------------------------------------
// Drawing rasters — the image side of the loop
// ---------------------------------------------------------------------------
export {
  decodeRaster,
  loadRaster,
  cropRaster,
  regionToPixelBox,
  otsuThreshold,
  extractSilhouette,
  cropSilhouetteToBBox,
  resampleMaskIntoFrame,
} from "./cad/image.js";
export type {
  Raster,
  RasterFormat,
  DecodeOptions,
  PixelBox,
  SilhouetteMode,
  SilhouetteOptions,
  Silhouette,
} from "./cad/image.js";

export { encodePngGray, maskToRaster } from "./cad/image_encode.js";
export { decodeJpeg } from "./cad/jpeg.js";

export {
  buildViewReferences,
  buildViewReferencesFromImage,
  ORTHOGRAPHIC_VIEW_KINDS,
} from "./cad/reference.js";
export type {
  ViewReference,
  ReferenceBuildResult,
  ReferenceBuildOptions,
} from "./cad/reference.js";

// ---------------------------------------------------------------------------
// Kernel loading and artifacts
// ---------------------------------------------------------------------------
export { loadKernel, installKernelGlobals, KERNEL_GLOBALS } from "./kernel.js";
export type { Kernel, LoadKernelOptions } from "./kernel.js";

export {
  exportShape,
  sanitizeBasename,
  formatExtension,
  formatOfPath,
} from "./export.js";
export type {
  ExportFormat,
  ExportOptions,
  ExportedFile,
  ExportResult,
} from "./export.js";

export { saveArtifacts, loadTree, ARTIFACT_DIR } from "./artifacts.js";
export type { ArtifactPaths, SaveArtifactOptions } from "./artifacts.js";

export {
  evaluateSketchSolves,
  normalizeSolveStatus,
  SUCCESS_CODES,
  DEFAULT_COST_TOLERANCE,
} from "./validators/sketch_solve.js";
export type { RawSolveStatus, SketchSolveOptions, SketchSolveOutcome } from "./validators/sketch_solve.js";

export { lintFeatureTree, checkAssociativity } from "./validators/design_intent.js";
export type {
  FeatureTreeLint,
  GeometryProbe,
  AssociativityCheck,
  AssociativityReport,
} from "./validators/design_intent.js";

export {
  measureEdgeDistance,
  maskOutline,
  DEFAULT_EDGE_THRESHOLDS,
  DEFAULT_SEARCH,
} from "./validators/edge_distance.js";
export type {
  EdgeDistanceOptions,
  EdgeDistanceResult,
  EdgeDistanceThresholds,
  Registration,
  SearchOptions,
} from "./validators/edge_distance.js";

export { validateGeometry, quickShapeCheck } from "./validators/geometric.js";
export { validateCodeSyntax, quickSyntaxCheck } from "./validators/code_syntax.js";
export { analyzeCoverage, checkPrimitiveCoverage } from "./validators/primitive_coverage.js";
export type { CoverageReport } from "./validators/primitive_coverage.js";

// ---------------------------------------------------------------------------
// Legacy shape-template helpers (superseded by the feature-tree emitter)
// ---------------------------------------------------------------------------
export { generateBoxCode } from "./templates/box_group.js";
export { generateCylinderCode } from "./templates/cylinder_group.js";
export { generateRevolveCode } from "./templates/revolve_group.js";
export { generateSweepCode } from "./templates/sweep_group.js";
export { generateAssemblyCode } from "./templates/assembly_group.js";

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
export {
  VIEW_INTAKE_SYSTEM,
  PROFILE_EXTRACTION_SYSTEM,
  FEATURE_TREE_SYSTEM,
  FEATURE_TREE_REFINE_SYSTEM,
  buildViewIntakePrompt,
  buildProfileExtractionPrompt,
  buildFeatureTreePrompt,
  buildFeatureTreeRefinePrompt,
  parseJsonResponse,
  repairJsonish,
} from "./prompts/feature_tree.js";

export {
  buildIntakeAnalysisPrompt,
  parseIntakeResponse,
  INTAKE_ANALYSIS_SYSTEM,
} from "./prompts/intake_analysis.js";
export {
  buildSpecGenerationPrompt,
  parseSpecResponse,
  validateSpecStructure,
  SPEC_GENERATION_SYSTEM,
} from "./prompts/spec_generation.js";
export {
  buildCodeGenerationPrompt,
  extractCode,
  CODE_GENERATION_SYSTEM,
} from "./prompts/code_generation.js";
export {
  buildCodeReviewPrompt,
  parseReviewResponse,
  buildGeometricRefinePrompt,
  CODE_REVIEW_SYSTEM,
  GEOMETRIC_REFINE_SYSTEM,
} from "./prompts/code_review.js";

// ---------------------------------------------------------------------------
// Pipeline-level types
// ---------------------------------------------------------------------------
export type {
  GeometricPrimitiveType,
  ImageAnalysis,
  DetectedPrimitive,
  PrimitiveRelationship,
  MaterialObservation,
  ParametricSpec,
  ParametricComponent,
  BooleanOp,
  AssemblySpec,
  AssemblyConstraint,
  ParameterDefinition,
  GeneratedCode,
  GeometryReport,
  ReviewResult,
  ReviewIssue,
  SandboxOutput,
  RefinementResult,
  PipelineStage,
  PipelineState,
  StepResult,
  LLMProvider,
  PipelineConfig,
  CodeContext,
} from "./types.js";
