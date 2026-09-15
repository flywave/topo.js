# img2cad — Image to parametric CAD

Turn a reference image or engineering drawing into a parametric CAD model built in
topo.js code — a constrained sketch history, not a bag of meshes.

## When To Use

The user attaches or points to an image of a mechanical part, bracket, plate, housing,
turned part, or an engineering drawing, and wants a parametric CAD model they can edit
by changing dimensions.

## Running It

```sh
# image → views → profiles → tree → code → measured review
topo-img2cad drawing.png --object "Mounting plate"

# edit a dimension in the emitted tree, then rebuild with no model involved
topo-img2cad --tree .topo-img2cad/tree.json -o ./out
```

Both need `pnpm --filter topo-img2cad build` first: the `bin` entry point is built by
rollup, not run from source. Exit code is 1 when the review fails, so it can gate CI.

From a script, use the library directly:

```ts
import { CadPipeline, createLLMProvider, loadKernel } from "topo-img2cad";

const { tp } = await loadKernel();          // loads topo-wasm and registers the globals
const pipeline = new CadPipeline({
  llm: createLLMProvider("openai"),
  tp,                                        // omit to generate code only
  workDir: "./out",
  maxRefinements: 3,
  verbose: true,
});

const result = await pipeline.run("./drawing.png", "Mounting plate");
console.log(result.review?.passed, result.review?.reprojection?.views);
```

### Pointing it at a gateway or a reasoning model

Anything OpenAI-compatible works through the `openai` provider; two settings
matter for gateways and for thinking models, and neither is obvious from a
failure:

```ts
const llm = createLLMProvider("openai", {
  baseUrl: "https://opencode.ai/zen/go/v1",
  apiKey: process.env.OPENCODE_API_KEY,
  model: "mimo-v2.5",
  maxTokens: 12288,
  headers: { "x-opencode-session": "my-session-1" },
});
```

- **Some gateways need their own routing headers.** OpenCode Go rejects a request
  that arrives without `x-opencode-session` (`MissingSessionID`), and asks clients
  to send their own `User-Agent` rather than a generic runtime's. Both go through
  `headers`; the provider always sends its own `User-Agent` so it is identifiable
  in a gateway's logs.
- **`maxTokens` is shared with the model's thinking.** An *always-thinking* model
  spends the budget on reasoning before it writes an answer, so a budget that is
  comfortable for a plain model can return `content: null` with the reasoning in a
  separate field. That reads as an empty success, so the provider raises a
  specific error naming the budget instead of letting it surface later as
  *"No JSON object found in view intake response"* — which blames the model's
  output format for what is really a token limit.
- **Thinking models are slow.** Measured against `mimo-v2.5`: minutes per call
  rather than seconds, and the pipeline makes one call per view plus one for the
  tree, so a full run is a background job rather than an interactive one. The CLI's
  `--verbose` progress goes to stderr so it is safe to run under a timeout.


## The Core Difference From 3D Modeling

This is not "place primitives and boolean them". It is CAD:

| 3D modeling | CAD construction (this pipeline) |
|---|---|
| primitives + transforms + booleans | sketches → features → body |
| hardcoded placement | datum planes + post-extrude placement |
| flat, unordered part list | ordered feature history |
| size constants | associative parameters and expressions |
| edit = rewrite code | edit = change a dimension, rebuild |
| verify = screenshot similarity | verify = measured silhouette re-projection |

The **feature tree is the design**. The emitted code is a build artifact rendered from
it, and the refinement loop edits the tree — never the code.

## Pipeline

```
image → views → constrained profiles → feature tree → code → measured review
       ↑                                                          │
       └────────────────── refine the tree ───────────────────────┘
```

```ts
import { CadPipeline, createLLMProvider } from "topo-img2cad";

const pipeline = new CadPipeline({
  llm: createLLMProvider("openai"),
  tp,                        // the WASM instance; omit to generate code only
  maxRefinements: 3,
  verbose: true,
});

const result = await pipeline.run("./drawing.png", "Mounting plate");
```

The refinement loop consumes `lint` + `review` issues, and a repair is accepted only
when it reduces the count of blocking errors — an equal-priority repair is no progress,
so the loop stops instead of burning the budget on no-ops. It also refuses to spend a
round on something a tree edit cannot fix: an emitter defect or a missing kernel is not
the tree's fault, and asking the model to "fix" it would corrupt a working design.

### Stage A — View intake

Classify how the object is depicted before describing it. A photograph and a
three-view drawing support completely different guarantees, and conflating them is
how a pipeline invents dimensions it cannot have read.

Output: `ViewSet` — drawing kind, views with their projection planes, scale evidence,
and an explicit list of what the image cannot show.

### Stage B — Profile extraction

Per orthographic view: closed loops as `line` / `arc` / `circle` entities, the
geometric relations the drawing implies, and the dimensions read off it.

The view is **cropped out of the drawing and shown to the model** (`visionProfiles`,
on by default in the CLI). Without that the model reads loops out of its own prose
description of the image, which is a paraphrase being measured against the drawing.

Output: `Profile2D` per view.

### Stage C — Feature tree

An ordered feature history plus its driving dimensions.

Output: `FeatureTree` — datums, sketches with constraints, ordered features,
associative `CadParameter`s, and design intent.

### Stage D — Build

Deterministic emission. No AI involved: a valid tree always produces the same code.

### Stage E — Review (measured, not judged)

| Gate | Catches |
|---|---|
| L0 syntax | malformed emission |
| L1 execution | a feature that throws |
| L2 geometry | null / non-solid / degenerate result |
| L3 solver residual | constraints not actually satisfied |
| L4 silhouette re-projection | valid solid, **wrong shape** |
| L5 view consistency | adjacent orthographic views disagreeing on a shared dimension |
| L6 associativity | a "parametric" model whose parameters drive nothing |

L4 is the gate that matters most and has no analogue in 3D modeling: the built BREP
solid is projected back along the view the drawing came from, rasterized, and compared
against the reference silhouette. The verdict is arithmetic — IoU, plus a directional
deviation in pixels that says *which way* it is wrong.

**Where the reference comes from.** The image itself. `lib/cad/image.ts` decodes the
PNG (or PGM/PPM) with no third-party dependency, `extractSilhouette` separates part
from paper, and `lib/cad/reference.ts` crops it to the view and registers it to model
coordinates through the drawing's scale callout. Nothing has to be assembled by hand:
passing `tp` is enough for L4 to run.

Two things about that are worth knowing:

- **Registration depends on scale evidence.** With a dimension callout the mask is
  given an absolute size in millimetres, so a model that is 20% too big fails. Without
  one the mask is scaled *uniformly* to fit the model: shape, aspect ratio and hole
  positions are still checked, size is not. The report says which happened
  (`registration: "absolute" | "normalized"`) rather than implying a size check it did
  not make. A non-uniform fit would be worse than useless — every pair of rectangles
  would agree.
- **The reference is read once, before refinement.** The drawing does not change when
  the tree does, and re-deriving it per round would risk measuring against a different
  silhouette each time.

Both silhouettes are rasterized in ONE shared frame (the union of the two extents) and
the model is registered to the frame's min corner. Normalizing each to its own bounding
box independently would make every pair of silhouettes agree, which is the exact
failure this gate exists to catch.


## Verified API Constraints

**Read this before changing the emitter.** Measured against the real kernel.
Full test: `test/wasm_e2e.test.ts`.

### The working construction: sketch → assemble → finalize → extrude

| Step | Call |
|---|---|
| lines | `sketch.segmentBetweenPoints(p1, p2, tag, false)` |
| arcs | `sketch.arcByThreePoints(p1, p2, p3, tag, false)` |
| circle | `sketch.circle(r, SketchMode.ADD, tag)` |
| dimensions | `sketch.constrain(tag, kind, value)` |
| solve | `sketch.solve()` — a cross-check, **not** what places the geometry |
| **wire the edges** | **`sketch.assemble(SketchMode.ADD, undefined)`** |
| solid | `sketch.finalize().extrude(d, combine, clean, both, taper)` |

This builds **arbitrary profiles** — polygons, L-brackets, line/arc loops — with
exact arcs, on all three named planes. Verified volumes: an L-bracket at exactly
28000, a stadium at exactly `(4000 + π·20²)·10`.

### What does not work, and why

| Construction | Result |
|---|---|
| `Workplane.polyline(pts).close()` → `extrude()` | **INVALID** — 2× volume, `isValid()` false |
| `Workplane.moveTo/lineTo/close()` → `extrude()` | **INVALID** — same |
| `Workplane.rect()` → `extrude()` | **INVALID** — same |
| `Sketch.polygon(pts)` with the first point **not** repeated | INVALID — volume 0, 5 faces |
| `Sketch.close()` after segments | throws an untranslated C++ exception |
| `Sketch.arcByCenter(...)` once the edges are wired | throws |
| `Sketch.edge(Wire)` | the binding wants an Edge and rejects a Wire |

The `Workplane.polyline().close()` failure is an **upstream bug**, not a usage
error. `face::make_from_wires` (go-topo `src/face.cc:1161-1162`) constructs
`BRepBuilderAPI_MakeFace(wire)` and then calls `Add(wire)` with the same wire,
registering it as both the outer and an inner boundary. OCCT returns a compound
of two coincident faces, so `extrude` makes two overlapping prisms — hence the
exactly-doubled volume, 10 faces, and `isValid() === false`. Removing the
redundant `Add` would fix `polyline`, `moveTo/lineTo/close` and `Workplane.rect`
for the whole project.

### Two traps that cost the most

**1. `solve()` does not write back.** It computes a correct solution and reports
it in `solve_status().x`, but the sketch's edges keep their authored coordinates.
A model relying on the runtime solver has dimensions that look meaningful and
change nothing. So `reconcileSketch` applies the dimensions to the coordinates at
emission time (deterministic, tested in `test/reconcile.test.ts`), and the emitted
`solve()` + residual is an independent cross-check on that arithmetic.

**2. `COINCIDENT` is not "endpoints meet".** The binding's `COINCIDENT` makes two
segments *overlap*; applied to a rectangle's adjacent edges it collapses the loop
into a degenerate fan at zero residual. Joining is a zero-distance constraint
between entity parameters — `DISTANCE [t1, t2, 0]` — and the emitter derives those
from the profile's adjacency so connectivity can never be omitted.

Which also means **connectivity must be stated exactly once, and a model's
`COINCIDENT` must not be emitted at all.** A live run spelled a plate's four edge
pairs `COINCIDENT`; the emitter derived the joins itself and emitted both, so every
edge pair carried two contradictory statements and the solver reported a residual
of **6986.67 where the same sketch with only the derived joins reports 0**
(measured). `mergeConstraintsVerbose` now drops a model `COINCIDENT` — the pair is
covered by derivation, or, if it is not, the constraint has no parameter pair to
translate into and would be emitted with the wrong meaning either way. Every drop
is reported, because silently discarding a constraint the model wrote is its own
kind of lie. Note the failure was invisible in the solid: reconciliation places the
geometry and `solve()` does not write back, so the part came out exactly right and
only L3 noticed.

### Placement

The sketch path ignores the datum plane's origin: a profile lands where its own
coordinates put it, starting at the plane's zero level. So profiles are emitted at
the origin and the placement is applied to the **solid**, after the extrude.
Translating the sketch workplane first does nothing at all.

### Dimensions drive the model

`reconcileSketch` walks the chain, applying each entity's own dimensions and
placing it so its entry meets the previous exit. When the dimensions do not
describe a closed loop, the last undimensioned line is snapped to close it — the
same thing a drafter does by leaving one edge undimensioned — and the residual is
reported when even that cannot close the loop. A contradictory pair of lengths, or
a constraint with no constructive reading, is reported rather than dropped.

## Feature Operations

| Op | Notes |
|---|---|
| `pad` | sketch + distance. Symmetric pads are extrude + translate, because `extrude(both=true)` is a known go-topo bug producing an empty shape |
| `pocket` | through-pockets are cut at 4× the largest dimension |
| `revolve` | refuses a profile crossing the axis, which silently yields an empty shape |
| `sweep`, `loft` | emitted against raw bindings not covered by the CQ shim — verify the arguments |
| `fillet`, `chamfer` | need a CadQuery edge selector (`"\|Z"`, `"#Z"`, `">Z"`) |
| `shell` | kind fixed to `"arc"`; any other throws `Unknown join type` |
| `pattern_linear`, `pattern_polar` | re-emit the source feature's tool; the source must be a material-removal feature |
| `mirror` | named planes only |
| `boolean` | cut / union / intersect against a sketch's extrude |

## Driving Dimensions

Parameters are expressions over other parameters, which is what makes the model
associative:

```json
{ "name": "plateThickness", "expr": "10", "unit": "mm", "min": 2 },
{ "name": "boreDiameter", "expr": "plateThickness * 1.2", "unit": "mm" }
```

Resolution is iterative, so forward references work. Cycles, unknown names, and
division by zero are reported rather than silently producing NaN. Expressions are
parsed by a small recursive-descent evaluator — **never** `eval`, so a spec from a
model can never execute code.

`CadPipeline.verifyAssociativity` rebuilds with each parameter perturbed and confirms
the geometry moves. A parameter that changes nothing is decorative, and is reported.
The L6 gate calls it automatically (one rebuild per parameter, disable with
`checkAssociativity: false`) and only on a tree that already passes everything else —
on a broken tree every parameter would read as inert and bury the real failure.

**Parameters drive features, and they drive sketch geometry too.** A coordinate, a
radius or a dimension value may be a number *or an expression over the parameters* —
`"end": ["overallWidth", 0]`, `"radius": "holeDiameter / 2"`. `resolveSketchValues`
substitutes the resolved numbers before emission, so a model that authors a properly
associative sketch gets an associative model. What it must not be is an array standing
in for arithmetic: `["holeDiameter", 2]` is reported as *"write `holeDiameter / 2`
instead"*, because guessing that a two-element array means a division would be
inventing intent.

Resolution is per-field and names its location. An unresolvable value is reported as
`sketch s_base: entity e1 end uses a value that did not resolve (…)` rather than
surfacing as *"the profile does not close"*, which tells a designer nothing.

A parameter referenced by nothing is reported as orphaned.

## Artifacts

With a `workDir` set, `lib/artifacts.ts` writes:

| File | Why this one |
|---|---|
| `.topo-img2cad/tree.json` | the design; edit a dimension here and rebuild with `--tree` |
| `.topo-img2cad/model.ts` | the emitted code, for reading and for use |
| `.topo-img2cad/review.json` | every measured verdict, including IoU per view |
| `.topo-img2cad/reference/<view>.png` | the silhouette the model was judged against |

The reference PNGs matter more than they look: L4 is the one verdict a reader cannot
check by reading the code, so when it fails, seeing the exact pixels the model was
compared to is the difference between a bug report and a fix.

## Deliverables — STEP and STL

The finished body is written out in both formats, next to the artifacts rather than
inside the dot-directory, because these are the product:

```sh
topo-img2cad drawing.png --object "Mounting plate"        # writes <name>.step and <name>.stl
topo-img2cad --tree .topo-img2cad/tree.json -o ./out       # same, no model involved
topo-img2cad --tree tree.json --export stl                 # one format
topo-img2cad --tree tree.json --no-export                  # neither
topo-img2cad --tree tree.json --stl-deflection 0.01        # finer mesh
```

| Format | What it carries | What it is for |
|---|---|---|
| `.step` | the exact BREP: analytic surfaces, edges, topology | editing; the format to hand to a CAD system |
| `.stl` | a triangulation of the same body, **binary** | printing, viewing, meshing |

Four things about the export that are worth knowing:

- **The kernel writes into Emscripten's in-memory filesystem, not yours.** Every
  export goes to `/tmp` inside the sandbox and is read back through `FS.readFile`.
  Writing straight to a host path produces no file at all *and returns success* —
  hence the read-back, and hence the tests check the files rather than the return
  values.
- **Every file is checked for the shape the format implies.** A STEP must open with
  `ISO-10303-21;`, contain a `DATA` section and reach its `END-ISO-10303-21;`
  terminator; a binary STL must be exactly `84 + 50 × triangles` bytes with a
  non-zero triangle count. A writer that fails can leave a truncated file behind,
  and a truncated file is worse than none.
- **`--stl-deflection` is the STL's only quality dial**, in model units. It is the
  chord tolerance the kernel meshes to, so it decides both fidelity and file size.
  0.1mm is the default; 0.01 on a 100mm part roughly triples the triangle count.
- **The STL is binary and has no units or topology.** It cannot be edited, and a
  consumer cannot tell mm from inches. STEP is the one that stays a CAD model.

Export happens even when the review failed, because a failed model's STEP is
exactly what you need to work out why — but the CLI says so plainly
(*"for inspection, not for use"*) and still exits 1. A file looks equally
authoritative either way, so leaving the reader to guess would be the real defect.

`--json` prints the result on stdout and routes the kernel's own output to stderr.
That matters because STEP export prints an OCCT transfer report from C++ to stdout,
which would otherwise land inside the JSON.

## Available CQWorkplane Methods

2D: `moveTo`, `lineTo`, `line`, `hline`, `vline`, `polyline`, `threePointArc`,
`sagittaArc`, `circle`, `ellipse`, `polygon`, `rect`, `close`, `rarray`
3D: `boxCentered`, `circleCentered`, `rectCentered`, `polygonSimple`
Ops: `extrudeSimple`, `revolveSimple`, `loftSimple`, `sweep`, `twistExtrude`
Boolean: `cut`, `union`, `add`, `intersect`
Modify: `fillet`, `chamfer`, `shell`, `holeThrough`, `cboreHole`, `cskHole`, `hole`, `cutThruAll`
Transform: `translate`, `rotate`, `mirror`, `transformed`
Selectors: `faces`, `edges`, `vertices`, `solids`, `shells`, `compounds`, `wires`

Note that these are the CQ shim's surface. Many of them are **not** verified to produce
valid solids — see the table above for the ones that are.

## Honest Limits

- **Arc profiles are exact, but a lone arc is not a loop.** A profile must close;
  a single arc does not, and is reported as such.
- **A profile must be fully dimensioned, or the closing edge must be free.** If
  every edge is pinned and the dimensions disagree, the loop cannot close and the
  emitter refuses rather than bending an edge to fit.
- **`reconcileSketch` covers single-entity dimensions** (`LENGTH`, `ORIENTATION`,
  `RADIUS`, `ARC_ANGLE`, `FIXED`) plus loop closure. Inter-entity `DISTANCE`
  between two midpoints is emitted for the kernel to check but is not applied to
  the coordinates, and is reported as such.
- **A circle sketch is not solver-checked.** `sketch.circle` places it exactly and
  there are no per-edge tags to constrain, so no `solve()` is emitted. The L3 gate
  expects reports only from sketches that were solved — expecting one for a circle
  would report a correct sketch as a failure.
- Single-view images cannot reveal hidden sides; `ViewSet.undetermined` records
  what is missing rather than guessing.
- Absolute size needs scale evidence. Without it, dimensions are relative and the
  pipeline says so — and L4 degrades from a size check to a shape check, which it
  reports rather than hides.
- **Only PNG and PGM/PPM drawings can be measured against.** There is no JPEG
  decoder and no image dependency is wanted; a JPEG drawing still produces a model,
  but L4 has no pixels to compare with and says so. Convert to PNG for the full loop.
  PNG must be non-interlaced (Adam7 is rejected with a message saying so).
- **STL export is binary only.** The binding hardcodes it; there is no ASCII switch,
  and post-processing an STL to change that is out of scope here.
- **A STEP is checked for structure, not re-read.** There is no STEP importer in the
  binding surface, so the file is validated for its header, `DATA` section and
  terminator rather than round-tripped. The STL is checked more strongly, because a
  mesh can be: its enclosed volume is computed from the triangles and compared with
  the BREP volume, which proves it is closed and wound outward.
- **`Shape.exportStep` / `writeToStl` writing to a host path silently produces no
  file.** They write into Emscripten's memory filesystem and still return `true`.
  Always go through `exportShape`, which writes to `/tmp` inside the sandbox and
  reads the bytes back out.
- **The reference is what `extractSilhouette` thinks the part is.** A photograph with
  a cluttered background, or a drawing where the part is not the largest enclosed
  region, will produce a wrong reference and therefore a wrong verdict. The mode
  (`ink` for solid/filled parts, `region` for line art) can be forced with
  `silhouetteMode`, and the chosen mode is reported.
- **The absolute size check rests on the model's pixel estimate — so it is
  realigned.** The drawing states a real length ("120") reliably; *how many pixels
  that spans* is a vision model eyeballing an image, measured 14% high on a real
  drawing (684 px reported for a 600 px edge). That 14% alone turned a
  geometrically perfect part into a 0.61 IoU and a failed run. The pixel figure is
  also the one number here we do not have to ask for — the silhouette *is* the
  part, so its own extent in pixels is what the dimension refers to. So the mask is
  placed at `realLength / measured pixels` instead, leaving the model's estimate
  doing only what it is good at: saying which axis the dimension is on.
  The correction is refused when the dimension plainly does not span the silhouette
  — a Ø40 hole in a 120mm plate — using a deliberately tight plausibility band
  (0.75–1.35×), because a band of "about 2×" lets exactly that case through and
  would invent a scale a factor of two out. When no realignment happened,
  `ViewReference.scaleFromModelEstimate` stays true, the pipeline warns that the
  frame was placed from an estimate, and a `RPR_LOW_IOU` against such a frame says
  *"check the scale evidence before resizing the part"* rather than inviting a
  repair to resize a correct model to match a mis-scaled reference.
- **`maxTokens` may need to be generous for a thinking model.** On a slow pass the
  same `mimo-v2.5` call that normally answers in 2k tokens spent all 12,288 on
  reasoning and returned nothing; the provider says so by name instead of reporting
  a missing JSON object. When the endpoint degrades this way it does so for *every*
  call, so a run that suddenly fails on all of them is the endpoint, not the tree.

### What the realignment was worth, measured

Replaying one run's own failing case — its tree, its drawing, its 684px scale
misread — through the fixed code, with no model involved:

| | before | after |
|---|---|---|
| L3 solver residual | 6986.67 | **0** |
| L4 silhouette IoU | 0.6130 | **0.9760** |
| L4 mean deviation | 10.87 px | **0.04 px** |
| L4 precision | 0.700 | 0.981 |
| volume vs analytic | 1.000000 | 1.000000 |

The geometry was right in both. One figure moved because the sketch stopped
contradicting itself, the other because the mask was placed at the size the
drawing states. An intermediate measurement read 0.895 until the *drawing* was
fixed: it showed its four corner holes as 2mm dots while the dimension text said
"4x Ø12". The model read the text and built Ø12, and the gate was right to
complain — the reference was the thing that was wrong.
- **A constraint the kernel's solver cannot satisfy is reported, not hidden.**
  Reconciliation puts the geometry where the dimensions say it goes, so a solid can
  come out exactly right while `solve()` reports a large residual — the emitted
  constraints and the emitted coordinates disagree. Both facts are surfaced
  (`SKT_HIGH_RESIDUAL`), because "the volume is right" and "the sketch is
  well-constrained" are different claims.
- `sweep` and `loft` emission is best-effort; those bindings are not covered by
  the CQ shim and the argument order should be verified against your build.
- Custom datum planes are refused: only XY / XZ / YZ have a verified mapping.
- The library is Node-targeted: it reads the drawing off disk with `node:fs` and
  decodes PNG with `node:zlib`. The UMD bundle resolves neither, so browser use
  means supplying your own `tp`, image bytes and raster.
