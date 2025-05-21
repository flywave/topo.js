export declare type SketchMode = {
  ADD: {},
  SUBTRACT: {},
  INTERSECT: {},
  CONSTRUCT: {},
  REPLACE: {},
}

declare type SketchVal  = Shape | Location

declare class Sketch {
  constructor();
  constructor(inPlane: Workplane, locs?: Location[], obj?: Compound);
  constructor(locs: Location[], obj?: Compound);

  hashCode(): number;

  getFaces(): Face[];

  face(
    shape: Wire | Edge[] | Shape | Sketch,
    angle?: number,
    mode?: SketchMode,
    tag?: string,
    ignoreSelection?: boolean
  ): Sketch;

  rect(
    w: number,
    h: number,
    angle?: number,
    mode?: SketchMode,
    tag?: string
  ): Sketch;

  circle(r: number, mode: SketchMode, tag?: string): Sketch;

  ellipse(
    a1: number,
    a2: number,
    angle: number,
    mode: SketchMode,
    tag?: string
  ): Sketch;

  trapezoid(
    w: number,
    h: number,
    a1: number,
    a2?: number,
    angle?: number,
    mode?: SketchMode,
    tag?: string
  ): Sketch;

  slot(
    w: number,
    h: number,
    angle: number,
    mode?: SketchMode,
    tag?: string
  ): Sketch;

  regularPolygon(
    r: number,
    n: number,
    angle: number,
    mode?: SketchMode,
    tag?: string
  ): Sketch;

  polygon(
    pts: Vector[],
    angle: number,
    mode?: SketchMode,
    tag?: string
  ): Sketch;

  rarray(xs: number, ys: number, nx: number, ny: number): Sketch;

  parray(
    r: number,
    a1: number,
    da: number,
    n: number,
    rotate?: boolean
  ): Sketch;

  distribute(
    n: number,
    start?: number,
    stop?: number,
    rotate?: boolean
  ): Sketch;

  push(locs: Location[], tag?: string): Sketch;

  eachFace(
    callback: (loc: Location) => Face,
    mode?: SketchMode,
    tag?: string,
    ignoreSelection?: boolean
  ): Sketch;

  eachSketch(
    callback: (loc: Location) => Sketch,
    mode?: SketchMode,
    tag?: string,
    ignoreSelection?: boolean
  ): Sketch;

  eachCompound(
    callback: (loc: Location) => Compound,
    mode?: SketchMode,
    tag?: string,
    ignoreSelection?: boolean
  ): Sketch;

  hull(mode: SketchMode, tag?: string): Sketch;

  offset(d: number, mode: SketchMode, tag?: string): Sketch;

  fillet(d: number): Sketch;
  chamfer(d: number): Sketch;
  clean(): Sketch;

  tag(tag: string): Sketch;
  select(tags: string[]): Sketch;

  faces(selector: string | Selector, tag?: string): Sketch;

  wires(selector: string | Selector, tag?: string): Sketch;

  edges(selector: string | Selector, tag?: string): Sketch;

  vertices(selector: string | Selector, tag?: string): Sketch;

  reset(): Sketch;
  deleteSelected(): Sketch;

  edge(val: Edge, tag?: string, forConstruction?: boolean): Sketch;

  segmentBetweenPoints(
    p1: Vector,
    p2: Vector,
    tag?: string,
    forConstruction?: boolean
  ): Sketch;

  segmentToPoint(p2: Vector, tag?: string, forConstruction?: boolean): Sketch;

  segmentByLengthAngle(
    l: number,
    a: number,
    tag?: string,
    forConstruction?: boolean
  ): Sketch;

  arcByThreePoints(
    p1: Vector,
    p2: Vector,
    p3: Vector,
    tag?: string,
    forConstruction?: boolean
  ): Sketch;

  arcByTwoPoints(
    p2: Vector,
    p3: Vector,
    tag?: string,
    forConstruction?: boolean
  ): Sketch;

  arcByCenter(
    center: Vector,
    radius: number,
    startAngle: number,
    deltaAngle: number,
    tag?: string,
    forConstruction?: boolean
  ): Sketch;

  splineWithTangents(
    points: Vector[],
    tangents?: [Vector, Vector],
    periodic?: boolean,
    tag?: string,
    forConstruction?: boolean
  ): Sketch;

  spline(points: Vector[], tag?: string, forConstruction?: boolean): Sketch;

  bezier(points: Vector[], tag?: string, forConstruction?: boolean): Sketch;

  close(tag?: string): Sketch;
  assemble(mode: SketchMode, tag?: string): Sketch;

  copy(): Sketch;
  moved(locs: Location[]): Sketch;
  located(loc: Location): Sketch;
  finalize(): Workplane;

  val(): SketchVal;
  vals(): Array<SketchVal>;

  add(): Sketch;
  subtract(): Sketch;
  replace(): Sketch;

  plus(other: Sketch): Sketch;
  minus(other: Sketch): Sketch;
  multiply(other: Sketch): Sketch;
  divide(other: Sketch): Sketch;
  at(indices: number[]): Sketch;

  filter(pred: (val: Shape | Location) => boolean): Sketch;
  map(f: (val: Shape | Location) => Shape | Location): Sketch;

  apply(f: (vals: Array<Shape | Location>) => Array<Shape | Location>): Sketch;
  sort(comp: (a: Shape | Location, b: Shape | Location) => boolean): Sketch;
}
