# img2cad — Image to parametric CAD

Turn a reference image or engineering drawing into a parametric CAD model built in
topo.js code — a constrained sketch history, not a bag of meshes.

## When To Use

The user attaches or points to an image of a mechanical part, bracket, plate, housing,
turned part, or an engineering drawing, and wants a parametric CAD model they can edit
by changing dimensions.

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
  references: { v_top: { kind: "loops", width: 512, height: 512, loops: [...] } },
  maxRefinements: 3,
  verbose: true,
});

const result = await pipeline.run("./drawing.png", "Mounting plate");
```

### Stage A — View intake

Classify how the object is depicted before describing it. A photograph and a
three-view drawing support completely different guarantees, and conflating them is
how a pipeline invents dimensions it cannot have read.

Output: `ViewSet` — drawing kind, views with their projection planes, scale evidence,
and an explicit list of what the image cannot show.

### Stage B — Profile extraction

Per orthographic view: closed loops as `line` / `arc` / `circle` entities, the
geometric relations the drawing implies, and the dimensions read off it.

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
- Single-view images cannot reveal hidden sides; `ViewSet.undetermined` records
  what is missing rather than guessing.
- Absolute size needs scale evidence. Without it, dimensions are relative and the
  pipeline says so.
- `sweep` and `loft` emission is best-effort; those bindings are not covered by
  the CQ shim and the argument order should be verified against your build.
- Custom datum planes are refused: only XY / XZ / YZ have a verified mapping.
