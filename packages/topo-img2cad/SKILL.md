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

### Industry hints

`industry` carries the vocabulary and typical construction for a domain — railway
overhead line, say — and is fed to all three stages. It is fenced off from the drawing
on purpose: the prompt tells the model to use it for **naming and construction order**
and states that it is *not evidence*, so every dimension and shape still has to come
from the drawing. A hint allowed to supply sizes is a hint that invents them.

It earns its keep. On the same catenary drawing, `mimo-v2.5` without a hint traced a
coarse 3-feature tree; `deepseek-v4.1-flash` with a dropper hint produced a 25-entity
profile, named its parameters `clampHeight` / `heartHalfWidth` / `tubeRadius` /
`wireHalfWidth`, inferred a realistic 1200mm dropper length, and derived the rest
(`shoulderY`, `tubeTopY`, `wireTopY`) from those — and the hint's note about which
construction fits a full-outline drawing is what kept it off `revolve`.

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
  separate field. That reads as an empty success, so the provider detects it and
  **retries once with twice the budget**, reporting the retry through `onLog` — the
  wait doubles, so it is not silent. Measured: a live run with `deepseek-v4.1-flash`
  at 32768 tokens spent all of it thinking about the feature tree and returned
  nothing, killing a four-minute run at its last stage. If the retry also comes back
  empty the error names the budget and says the thinking shares it. An answer that
  was simply empty is *not* retried: that wants the prompt fixed, not more room.
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

The refinement loop consumes `lint` + `review` issues. It refuses to spend a round on
something a tree edit cannot fix — an emitter defect or a missing kernel is not the
tree's fault, and asking the model to "fix" it would corrupt a working design.

A repair is then accepted on measured evidence, in this order:

1. **Fewer blocking errors wins.**
2. **Failing that, a better silhouette wins.** The loop exists to improve a
   *measurement*, and a measurement routinely improves without changing how many
   issues it produces: a plate a quarter too small refines to exactly right while the
   issue count stays at one. Judging on the count alone rejects that repair and stops
   with the wrong part. This was not theoretical — it is what the first version did.
3. **A repair that makes the silhouette worse is refused**, and the previous tree is
   kept.

Two thresholds decide whether the loop engages at all, and both were wrong in ways
worth recording:

- **`RPR_LOW_IOU` fails whenever IoU < `minIou`, and warns only within 5% of it.**
  The band used to be a fifth of the threshold wide, which graded a silhouette
  matching at **IoU 0.75 — a part a quarter too small — as a warning**. The run
  reported PASSED and, because the loop acted on failures, nothing was ever repaired.
  A gate that calls a 25% size error a pass is not a gate.
- **The loop's guard is "is there something a tree edit could fix", not "did a gate
  fail".** Asking the second question separately disabled the loop for exactly the
  cases worth repairing, since a warning-level mismatch does not fail a gate.
- **What the loop converges on is whichever measurement exists.** Mask IoU where
  there is a silhouette to make it against; the outline gate's chance ratio where
  there is not. Without the second, a run against an annotated drawing would have no
  measurement to improve — a repair that left the same one blocking issue behind
  would be refused as "changed nothing" even when it halved the distance, and the
  loop would stop with the wrong part one repair short. It is the ratio, not the raw
  pixels, because pixels mean different things on drawings of different density.
- **The measurement goes to the model, not just the verdict.** The repair prompt
  carries the outline distance, the drawing's chance floor, and *where* on the model
  the worst tenth of the outline is, as a fraction of the model's own extent — a mean
  says a model is wrong, a location says which feature to change. The prompt also says
  what not to do: the placement and the overall scale have already been searched, so
  moving or uniformly resizing the part cannot repair an `EDG_OUTLINE_MISMATCH`.

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

The prompt states the drawing's millimetres-per-pixel, but nothing in the answer
enforces it: the coordinates come back in units of the model's own choosing. When a
trace really is in the wrong units, nothing says so, and because the geometry then
contradicts it, the very dimension that measures it is *dropped* by the constraint
merger rather than applied — leaving the parameter driving nothing. That is the case
this stage exists for.

It is worth knowing what it is NOT for, because a live diagnosis got this wrong for
two rounds. On a real annotated drawing the fit computed 0.798 and the trace looked
25% oversized. The actual cause was that reconciliation was inflating the traced
outline by 69% on its way to code — see the notes on `consistentArcs` and on the
sense of a declared direction in `lib/cad/reconcile.ts`. With those fixed the same
trace measures 150 against the stated 150 and **the fit does nothing at all**, which
is the correct outcome. A real scale error and a geometry defect look identical from
here; only finding out *why* the geometry disagrees tells them apart.

So `lib/cad/scale_fit.ts` fits the traced size to the dimensions the drawing states,
before any geometry is emitted. It is narrow on purpose:

- **Only a dimension that spans the profile counts.** The candidate's span must
  match the profile's own width or height within 15%, or it is not evidence about
  the part's size. A hole diameter or a wall thickness is not, and treating one as
  if it were would rescale the whole part to match a feature.
- **The requested value must be near the span it measures** (within 1.5x). A plate
  60 high whose two long edges are dimensioned 120 apart has a ratio of 2 — a
  different quantity, not a mis-scaled one.
- **Dimensions written as expressions are resolved** against the parameters, since
  that is how a model usually states an overall size (`value: "overallHeight"`).
- **One scale for the whole tree, never one per sketch.** A part is a single set of
  coordinates spread across an outline and the pockets inside it; scaling the
  outline alone was measured to leave the pockets outside the body, and the
  kernel's cut crashed outright (`NCollection_Sequence::ChangeValue`).
- **If the dimensions disagree about the shape** (two of them imply scales more than
  25% apart) no single scale fits, so the traced size is kept and the disagreement
  is reported with its numbers rather than averaged into a guess.

Fitting first is what turns a *dropped* constraint into an *applied* one: the merger
refuses a two-entity distance its own geometry contradicts, so once the geometry
agrees with the dimension, the dimension is emitted as the constraint it was meant
to be and the parameter drives real geometry.

Like every other hypothesis here, the fit is **verified against the kernel**: if the
fitted geometry does not build while the traced geometry does, the traced body is
kept and the run says which happened and why. That is not a theoretical branch —
measured on the real drawing, the fit computed exactly the right factor (0.798) and
the corrected geometry contained two detail circles the kernel's cut refuses, so
the traced body is what survived, with the refusal reported.

Output: `Profile2D` per view.

A traced arc arrives as a centre, a radius and two endpoints, and nothing makes those
four numbers agree. Measured on a real outline: **12 of 15 arcs had their endpoints
10-67% off their own declared circle**, while the endpoint chain closed to 0.0000 —
the tracer produced a point chain and padded the bulges with plausible-looking centres
and radii. Reconciliation repairs that on the way to code (the endpoints are kept, the
centre moves), but a repair is a guess about geometry, so `DIN_ARC_INCONSISTENT`
reports the defect itself, as a warning the repair loop acts on. See
`DIN_ARC_INCONSISTENT` in `lib/validators/design_intent.ts`.

### Stage C — Feature tree

An ordered feature history plus its driving dimensions.

Output: `FeatureTree` — datums, sketches with constraints, ordered features,
associative `CadParameter`s, and design intent.

### Stage D — Build

Deterministic emission. No AI involved: a valid tree always produces the same code.

### Stage E — Review (measured, not judged)

| Gate | Catches |
|---|---|
| L0 tree lint | a defect visible in the tree itself, without emitting or building |
| L1 syntax | malformed emission |
| L1 execution | a feature that throws |
| L2 geometry | null / non-solid / degenerate result |
| L3 solver residual | constraints not actually satisfied |
| L4 silhouette re-projection | valid solid, **wrong shape** |
| L4b outline-to-ink distance | valid solid, **wrong shape**, when the drawing has no silhouette to give |
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


## L4b — the outline gate, for drawings that have no silhouette

L4 needs a reference *silhouette*: one closed region that is the part. A densely
annotated drawing does not have one — a fully dimensioned single part measured 143
enclosed regions with the largest holding 19% of the area — and a drawing of an
assembly does not either. On exactly those drawings the shape check went silent, and
a run came back `PASSED` with half its outline more than thirty pixels from anything
the sheet had drawn.

`lib/validators/edge_distance.ts` measures the same thing without needing a region.
It takes the OUTLINE of the model's re-projection and asks how far it is from the
drawing's **ink** — every dark stroke, annotation included. Annotation does not break
it: a dimension line near the part makes the measure slightly lenient, where a missing
region made it impossible.

Four things make the number mean something:

- **The comparison runs on the drawing's own pixel grid**, not the model's raster
  size. Upsampling a one-pixel stroke into a larger grid turns it into a dashed line,
  and a correct model then reads as 2-3px away no matter how right it is.
- **Two bars, and both must be met.** The absolute one (`maxMeanFraction`, as a
  fraction of the frame diagonal) asks "is the outline on the drawing". The chance
  one (`maxMeanRatio` × the distance an *arbitrary* placement scores) asks "is it much
  closer to the ink than a placement that knew nothing would be". The second exists
  because the first is close to free on a busy sheet: measured on a real annotated
  drawing a wrong model scored 19.5px against a 28.5px floor. Measured separation:
  correct part 0.003-0.13, traced disc where the drawing had a part 0.30-0.69.
- **The chance bar has a one-pixel floor** (`matchFloorPx`). A correct model's outline
  is a pixel from the drawn one by rasterization alone — both are one pixel wide — and
  on a dense sheet that pixel is a large share of the bar. The floor is as small as it
  can be: every pixel of it is a placement any model can aim for.
- **Placement is searched, but only within a quarter of the frame**, and scale only
  within ±20%. The model's coordinates come from the profile read off this drawing, so
  its placement is known to within the sheet's margin — but only to within that, and
  the margin is not recorded anywhere. Searching the whole sheet was measured to move
  a two-disc model 94% of the frame onto a dense corner and score it 3.9px, passing
  something nothing should pass. Where the search ran, `registration.scale` and
  `registration.movedFraction` are in the result and in `review.json`.

`reference.ts` builds the line reference when it refuses the mask: `maskUsable: false`,
the ink is the view's whole region, and the frame comes from the drawing's stated
scale with no silhouette to check it against (the note says so). The mask gate is
skipped for that view; the outline gate is not. The reference PNG written to
`.topo-img2cad/reference/` is the ink in that case, so the gate's input can be looked at.

**What it does not do.** It cannot see a feature the drawing does not dimension, it is
blind to size when the drawing carries no scale, and it cannot tell a part from a
correctly-shaped hole in one. It is a shape check that survives annotation, not a
replacement for L4 where L4 can run.

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

## Constraint Kinds the Binding Actually Has

`tp.SketchConstraintKind` offers exactly **FIXED, FIXED_POINT, COINCIDENT, ANGLE,
LENGTH, DISTANCE, RADIUS, ORIENTATION, ARC_ANGLE**. Every other name a model reaches
for is `undefined`, and passing `undefined` where an enum is expected fails inside
Embind's marshaller with an error whose message is itself `undefined` — a live run
lost its entire body to that.

So the emitter maps what it can and refuses what it cannot, by name:

| Written | Emitted | Why |
|---|---|---|
| `HORIZONTAL` (per line) | `ORIENTATION [±1, 0]` | same statement, AND the sign comes from how the line is drawn |
| `VERTICAL` (per line) | `ORIENTATION [0, ±1]` | idem |
| `JOIN` | `DISTANCE [t1, t2, 0]` | zero distance between entity parameters is what joining is |
| `COINCIDENT` | *dropped* | the binding's meaning is "these overlap"; connectivity is derived instead |
| `PARALLEL`, `PERPENDICULAR`, `TANGENT`, `SYMMETRIC` | *dropped, reported* | inter-entity with no confident mapping — a guess would be silent |

**The sign matters, and getting it wrong is not merely imprecise.** `ORIENTATION` is a
*signed* direction while "horizontal" means parallel to the axis either way. Asserting
`[1, 0]` on an edge drawn right-to-left states the opposite of what is there: a live
profile had three such edges in one closed chain, so the solver had to flip them, the
joins broke, and it wandered to coordinates like 13380 while reporting a residual of
**4.9 instead of 0**. Taking the sign from the authored geometry keeps the intent and
leaves the coordinates already satisfying it, so the solver has nothing to move.

The same rule covers the other two ways a model's intent outruns the binding:
a **fillet selector** must be a selector (`|Z`, `#Z`, `>Z`), not a sentence, or the
marshaller throws an `undefined` error; and a **through pocket carrying the pad's
own sketch** removes the body it was meant to modify, which is reported as
`DIN_REMOVES_WHOLE_BODY` rather than surfacing as "volume 0".

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

### More than one base feature

A second `pad` / `revolve` / `sweep` / `loft` **adds** to the body — `body = body.union(…)`.
It used to assign over it, silently discarding everything built so far: a live run's tree
traced a 100×200×10 catenary-dropper profile (volume 56000, 26 faces) and then two wire
discs, and the finished model was the two discs. The user reported "only two discs were
generated", which was exactly right.

The tree is then reported as `DIN_MULTIPLE_BODIES`: this pipeline models one part, so a
drawing of several parts comes out as their union, not as an assembly.

### Two steps that can kill the kernel

**Export runs before the associativity probes.** Those probes rebuild the model with
each parameter perturbed, and a perturbed build that fails can kill the kernel
outright — after one such run every later call returned `Aborted()` and the export,
the actual deliverable, was lost. Measured, twice. The export is the product; a later
diagnostic must not be able to take it away.

**The kernel cannot always triangulate its own faces.** On two different extrusions
the two LARGEST faces — the caps — came back with zero triangles, while `mesh()`
still listed their vertices. The STL writer says so in a line nobody reads
("N faces have been skipped due to null triangulation") and hands over a file missing
its caps: measured at 0.10 of the solid's surface area and 0.67 of its volume, on a
shape whose STEP was exact. `exportShape` now measures that and says it in words.
Neither deflection nor a different mesh angle changes it (identical at 0.1 / 0.01 /
0.001), so it is the geometry, not the tolerance.

### `mirror` with a named source

`{"op":"mirror","plane":{...},"ofFeature":"f_hole"}` reflects **that feature's tool** and
re-cuts with it. Without `ofFeature` it mirrors the whole body, which is what it always
did.

It used to ignore `ofFeature` entirely. A live run asking to mirror a mounting hole
about YZ and then XZ got the *body* mirrored twice and a plate **20mm thick instead of
10, with twice the volume** — and nothing caught it. A silhouette taken along the
sketch normal is blind to thickness, and a single view leaves no second view to
disagree with. The tree said 10; only the tree said 10.

**Mirroring a mirror composes**: `mirror(plane, base, copy=true)` returns the tool *union
its reflection*, so the second mirror reflects the pair. A corner hole mirrored about YZ
and then about XY is all four corners in two features, and measured exactly
`120·80·10 − π·20²·10 − 4·π·6²·10`.

One case is refused, and it is the case models get wrong. **A feature lies IN its own
sketch plane, so reflecting it through that plane changes nothing** — the reflection
lands exactly on the original, and the kernel's fuse of two coincident tools fails
outright (*"null function or function signature mismatch"*). A live run mirrored a hole
about XZ to move it "across the height" when the plate was sketched on XZ and the height
is world Z: XZ is the plane the feature already occupies, so it moved nothing. The
emitter detects this by walking the source feature back to its sketch plane and refuses
with the reason and the remedy, rather than crashing or silently dropping half a
four-hole pattern. The prompt now states the convention in the same words.

The same-plane check needs the mirrored feature's own plane, so it follows `ofFeature`
back through any intervening mirrors to whatever carries the sketch.

### When the solver throws

`Sketch.solve()` is a cross-check: reconciliation already placed the geometry and
`solve()` does not write back. It is also the one call in the emitted code that can
throw — the kernel's NLopt backend fails outright on some constraint sets
(*"Sketch.solve: nlopt failure"*, on a real 1200mm catenary profile). Letting that
escape cost the entire model, twice. It is now wrapped, recorded as
`{ status: -1, cost: Infinity, note }`, and L3 reports it as the failed verification it
is — so the body, the STEP and the STL all survive a solver that could not converge.

`CadPipeline.verifyAssociativity` rebuilds with each parameter perturbed and confirms
the geometry moves. Two things had to be right for that verdict to be trustworthy,
both found by a live run whose four "inert parameters" were all false:

- **A dimension may name several entities.** Models write `LENGTH [e1, e3] = 120` for a
  rectangle's two long edges. Reconciliation only read single-tag dimensions and
  skipped the rest *silently* — `applied` listed the survivors, `unhonoured` was
  empty — so a parameter reaching the sketch only through such a dimension drove
  nothing, and the gate then blamed the parameter. Per-entity kinds (`LENGTH`,
  `RADIUS`, `ARC_ANGLE`, `ORIENTATION`) now apply to each entity named; relational
  kinds (`DISTANCE`, `COINCIDENT`, `JOIN`) still are not read that way.
- **The probe has to be able to see the change.** Volume, bounding box, face count
  and even the centre of mass are blind to a feature moving *within* the part:
  relocating a bolt hole removes exactly as much material as before, and four
  symmetric holes moving outward leave the centroid where it was. Measured, on all
  four. The probe now also computes the summed squared distance of every tessellated
  vertex from the origin — order-independent, one mesh, and it moves the instant any
  face does. A parameter that changes nothing is decorative, and is reported.
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
| `.topo-img2cad/review.json` | every measured verdict, including IoU per view and the outline gate's distance, chance floor and placement |
| `.topo-img2cad/reference/<view>.png` | the silhouette the model was judged against — or the drawing's ink, when there was no silhouette |

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
- **`kind` is a drafting label; `projectionPlane` is the geometric fact, and the
  gate projects along the fact.** A model that calls a sheet's view "front" while
  recording that it is the XY plane — and building its sketches on XY — is only
  mislabelling it. Projecting along the label looks at the part's 10mm edge instead
  of its 120x80 face: measured at **IoU 0.154 on a part whose volume was right to six
  significant figures.** The same rule now drives the prompt's sketch-plane guidance,
  so the instruction and the measurement cannot disagree.
- **A view without a `region` is only read as the whole image when the sheet holds
  one view.** On a multi-view sheet that would blend every view into a single
  silhouette and report a confident, meaningless IoU, so those views get no reference
  at all and the run says so. "Cannot check this" is a worse answer than a passing one
  and a much better answer than a wrong one.
- Single-view images cannot reveal hidden sides; `ViewSet.undetermined` records
  what is missing rather than guessing.
- Absolute size needs scale evidence. Without it, dimensions are relative and the
  pipeline says so — and L4 degrades from a size check to a shape check, which it
  reports rather than hides.
- **A drawing's colour is layer information, and is kept.** CAD sheets routinely draw
  the part outline in black and the dimension layer in blue. Read as luminance alone
  both are "dark", so the annotation counts as part material and its many lines chop
  the part's interior into pieces: a fully dimensioned drawing of a single character
  came out as 143 regions with the largest holding 19% of the area, and no silhouette
  could be built at all. Excluding coloured pixels took that to 4 regions and 79% —
  but does not finish the job, because annotation TEXT and centre lines are drawn
  dark too, and where a leader crosses the outline the exclusion opens the outline
  and the fill leaks. `Raster.colorful` carries the information; separating a densely
  annotated sheet's layers properly needs more than a colour test, and is not done.
- **PNG, JPEG and PNM are readable; PNG must be non-interlaced** (Adam7 is
  rejected with a message saying so), and JPEG must be baseline sequential. A
  progressive JPEG is refused by name rather than mis-decoded. The decoder is
  hand-written like the PNG one, so the package still has no image dependency.
- **The ink/paper cut is read off each image (Otsu), not fixed.** A fixed
  threshold is a bet that the drawing is crisp black on white. A real scanned
  catenary drawing was 89% near-white with its lines in mid-gray, so only 1% of
  pixels fell below 128: nothing closed, no region was found, and the gate had
  nothing to compare against. Adaptive thresholds land on the same value for
  genuine black-on-white art.
- **A drawing with no single part has no silhouette to give — and that is now only
  the mask gate's problem.** One part's region dominates its drawing's enclosed area
  (83% for a real plate); a catenary illustration's largest region held 13% across 64
  regions, because it is nine components plus annotation boxes. Below half, no MASK
  reference is built and the run says the drawing looks like an assembly. The ink is
  still there, so the outline gate runs — see "L4b" above. Measuring a model against
  the largest of those regions would answer a question nobody asked, confidently.
- **STL export is binary only.** The binding hardcodes it; there is no ASCII switch,
  and post-processing an STL to change that is out of scope here.
- **A written STL is checked against the solid it came from.** A structurally valid
  mesh can still be an open one: the kernel skips faces it cannot triangulate and says
  so in a line nobody reads ("2 faces have been skipped due to null triangulation"),
  and the result is an STL that looks fine and slices wrong. On the catenary dropper
  that was **66.7% of the volume** — exactly two faces' worth, on a 50-face solid. The
  export now reports `watertight` and `volumeRatio` per file and says so in words. The
  STEP is unaffected; it carries the BREP, not a triangulation.
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
  **Which dimensions may be used for that is decided by the label, not the
  arithmetic.** A dimension measuring a *feature* — `Ø40`, `R12`, a thickness — has
  no relation to the silhouette's own extent, so realigning to it invents a scale.
  A ratio test cannot separate the two: measured across live runs the model's pixel
  estimate for a genuine overall dimension has been off by up to **46%**, which
  lands exactly where a bore diameter would. Drawings mark feature dimensions with a
  prefix, so `Ø`/`⌀`/`φ`/`R`/`DIA`/`RADIUS`/`THK` labels are excluded outright, and
  the remaining overall dimensions get a wide band (0.4–2.5×) because being strict
  here means falling back to the very number the correction exists to replace.
  When no realignment happened, `ViewReference.scaleUnverified` stays true, the
  pipeline warns that the frame was placed from an estimate, and a `RPR_LOW_IOU`
  against such a frame says *"check the scale evidence before resizing the part"*
  rather than inviting a repair to resize a correct model to match a mis-scaled
  reference.
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
