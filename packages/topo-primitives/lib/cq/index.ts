/**
 * CadQuery-style Workplane shim — bridges go-topo's CQ convenience wrappers
 * to the Embind-bound tp.Workplane. Chainable: every method returns a new
 * CQWorkplane wrapping the underlying Workplane returned by that call.
 *
 * NOTE: Embind `optional_override` does not expose C++ default parameters to
 * JS callers — calling with too few arguments fails with
 * "Cannot pass non-string to std::string". We work around this by always
 * passing explicit defaults for optional params.
 *
 * boxCentered now calls the new Workplane.box(l,w,h,true,true,true) binding
 * instead of rect+extrude — the old extrude(both=true) path hits a go-topo
 * C++ core bug (bidirectional extrude corrupts geometry).
 */

// ---------------------------------------------------------------------------
// Helpers (exported for tests / consumers)
// ---------------------------------------------------------------------------

/** Create a gp_Pnt from (x, y, z). */
export function pnt(tp: any, x: number, y: number, z: number): any {
    return new tp.gp_Pnt_3(x, y, z);
}

/** Create a Vector from (x, y, z) — used for pushPoints / origin. */
export function vec(tp: any, x: number, y: number, z: number): any {
    return new tp.Vector(x, y, z);
}

/** Create a gp_Vec from (x, y, z) — used for translate / transformed. */
export function gpVec(tp: any, x: number, y: number, z: number): any {
    return new tp.gp_Vec_4(x, y, z);
}

// ---------------------------------------------------------------------------
// CQWorkplane
// ---------------------------------------------------------------------------

export class CQWorkplane {
    readonly tp: any;
    readonly wp: any;

    /** Default XY workplane at origin. */
    constructor(tp: any);
    /** Named plane with optional origin. */
    constructor(tp: any, planeName: string, origin?: any);
    constructor(tp: any, planeName?: string, origin?: any) {
        this.tp = tp;
        if (planeName != null) {
            // Embind ctor requires exactly 0 or 3 args; pass explicit undefined for unused params.
            this.wp = origin != null
                ? new tp.Workplane(planeName, origin, undefined)
                : new tp.Workplane(planeName, undefined, undefined);
        } else {
            this.wp = new tp.Workplane();
        }
    }

    /** Return the underlying tp.Workplane. */
    unwrap(): any {
        return this.wp;
    }

    /** Wrap a tp.Workplane returned from the underlying layer into a new CQWorkplane. */
    private _wrap(newWp: any): CQWorkplane {
        const r = new CQWorkplane(this.tp);
        (r as any).wp = newWp;
        return r;
    }

    // -----------------------------------------------------------------------
    // Selector methods — Embind requires all positional args to be passed;
    // tag defaults to "" (matches C++ default).
    // -----------------------------------------------------------------------

    faces(selector?: any, tag?: string): CQWorkplane {
        return this._wrap(this.wp.faces(selector ?? "", tag ?? ""));
    }

    edges(selector?: any, tag?: string): CQWorkplane {
        return this._wrap(this.wp.edges(selector ?? "", tag ?? ""));
    }

    vertices(selector?: any, tag?: string): CQWorkplane {
        return this._wrap(this.wp.vertices(selector ?? "", tag ?? ""));
    }

    solids(selector?: any, tag?: string): CQWorkplane {
        return this._wrap(this.wp.solids(selector ?? "", tag ?? ""));
    }

    // -----------------------------------------------------------------------
    // Direct pass-through methods (same name, same params)
    // -----------------------------------------------------------------------

    center(x: number, y: number): CQWorkplane {
        return this._wrap(this.wp.center(x, y));
    }

    lineTo(x: number, y: number, forConstruction?: boolean): CQWorkplane {
        return this._wrap(this.wp.lineTo(x, y, forConstruction ?? false));
    }

    line(dx: number, dy: number, forConstruction: boolean): CQWorkplane {
        return this._wrap(this.wp.line(dx, dy, forConstruction));
    }

    hline(d: number, forConstruction: boolean): CQWorkplane {
        return this._wrap(this.wp.hline(d, forConstruction));
    }

    vline(d: number, forConstruction: boolean): CQWorkplane {
        return this._wrap(this.wp.vline(d, forConstruction));
    }

    hlineTo(x: number, forConstruction: boolean): CQWorkplane {
        return this._wrap(this.wp.hlineTo(x, forConstruction));
    }

    vlineTo(y: number, forConstruction: boolean): CQWorkplane {
        return this._wrap(this.wp.vlineTo(y, forConstruction));
    }

    moveTo(x: number, y: number): CQWorkplane {
        return this._wrap(this.wp.moveTo(x, y));
    }

    move(dx: number, dy: number): CQWorkplane {
        return this._wrap(this.wp.move(dx, dy));
    }

    polyline(points: any[], forConstruction?: boolean, includeCurrent?: boolean): CQWorkplane {
        return this._wrap(this.wp.polyline(points, forConstruction, includeCurrent));
    }

    close(): CQWorkplane {
        return this._wrap(this.wp.close());
    }

    /**
     * sketchLoop(vertices) — a closed polygon profile through the Sketch API
     * (wp.sketch → segment → assemble → finalize), the same recipe the Go
     * interpreter uses. The workplane polyline+close path is NOT used: its
     * pending-edge → wire → face pipeline produces corrupt prisms for
     * rectangles off the origin (deterministic wrong volumes, verified by
     * probe; the Sketch path is exact at every position).
     * `vertices` are [x, y] pairs in sketch coords; the loop closes
     * wrap-around.
     */
    sketchLoop(vertices: Array<[number, number]>): CQWorkplane {
        const sk = this.wp.sketch();
        const V = (x: number, y: number) => new this.tp.Vector(x, y, 0);
        for (let i = 0; i < vertices.length; i++) {
            const [x1, y1] = vertices[i];
            const [x2, y2] = vertices[(i + 1) % vertices.length];
            sk.segmentBetweenPoints(V(x1, y1), V(x2, y2), undefined, false);
        }
        sk.assemble(this.tp.SketchMode.ADD, undefined);
        return this._wrap(sk.finalize());
    }

    mirrorX(): CQWorkplane {
        return this._wrap(this.wp.mirrorX());
    }

    mirrorY(): CQWorkplane {
        return this._wrap(this.wp.mirrorY());
    }

    threePointArc(p1: any, p2: any, forConstruction?: boolean): CQWorkplane {
        return this._wrap(this.wp.threePointArc(p1, p2, forConstruction ?? false));
    }

    shell(thickness: number, kind: string): CQWorkplane {
        return this._wrap(this.wp.shell(thickness, kind));
    }

    fillet(radius: number): CQWorkplane {
        return this._wrap(this.wp.fillet(radius));
    }

    chamfer(l: number, l2?: number): CQWorkplane {
        return this._wrap(
            l2 != null ? this.wp.chamfer(l, l2) : this.wp.chamfer(l)
        );
    }

    /**
     * 放置文字 (T1.1, workplane::text)。WASM 无系统字体, 需经 fontPath 提供
     * ttf (可先 tp.FS.writeFile 进 MEMFS)。kind: 0=REGULAR 1=BOLD 2=ITALIC;
     * halign: 0=LEFT 1=CENTER 2=RIGHT; valign: 0=BOTTOM 1=CENTER 2=TOP。
     */
    text(
        txt: string,
        fontsize: number,
        distance: number,
        opts?: {
            cut?: boolean;
            combine?: boolean;
            clean?: boolean;
            font?: string;
            fontPath?: string;
            kind?: number;
            halign?: number;
            valign?: number;
        }
    ): CQWorkplane {
        const o = opts ?? {};
        return this._wrap(
            this.wp.text(
                txt, fontsize, distance,
                o.cut ?? true, o.combine ?? false, o.clean ?? true,
                o.font ?? "Arial", o.fontPath ?? "",
                o.kind ?? 0, o.halign ?? 1, o.valign ?? 1
            )
        );
    }

    translate(gpVecArg: any): CQWorkplane {
        return this._wrap(this.wp.translate(gpVecArg));
    }

    rotate(p1: any, p2: any, angleDeg: number): CQWorkplane {
        return this._wrap(this.wp.rotate(p1, p2, angleDeg));
    }

    add(other: CQWorkplane | any): CQWorkplane {
        const src = other instanceof CQWorkplane ? other.unwrap() : other;
        return this._wrap(this.wp.add(src));
    }

    cut(other: CQWorkplane | any, clean?: boolean, tol?: number): CQWorkplane {
        const src = other instanceof CQWorkplane ? other.unwrap() : other;
        return this._wrap(this.wp.cut(src, clean, tol));
    }

    union(other: CQWorkplane | any, clean?: boolean, glue?: boolean, tol?: number): CQWorkplane {
        const src = other instanceof CQWorkplane ? other.unwrap() : other;
        return this._wrap(this.wp.union(src, clean, glue, tol));
    }

    cboreHole(
        diameter: number, cboreDiameter: number, cboreDepth: number,
        depth?: number, clean?: boolean
    ): CQWorkplane {
        return this._wrap(this.wp.cboreHole(diameter, cboreDiameter, cboreDepth, depth, clean));
    }

    hole(diameter: number, depth?: number, clean?: boolean): CQWorkplane {
        return this._wrap(this.wp.hole(diameter, depth, clean));
    }

    twistExtrude(
        dist: number, angleDeg: number, combine: boolean, clean: boolean
    ): CQWorkplane {
        return this._wrap(this.wp.twistExtrude(dist, angleDeg, combine, clean));
    }

    tag(name: string): CQWorkplane {
        return this._wrap(this.wp.tag(name));
    }

    val(): any {
        return this.wp.val();
    }

    vals(): any[] {
        return this.wp.vals();
    }

    size(): number {
        return this.wp.size();
    }

    // -----------------------------------------------------------------------
    // Composite / reordered methods — aligned with go-topo workplane.go
    // -----------------------------------------------------------------------

    /** box(l, w, h, centerAll=true, combine=true, clean=true) */
    boxCentered(l: number, w: number, h: number): CQWorkplane {
        return this._wrap(this.wp.box(l, w, h, true, true, true));
    }

    circleCentered(r: number): CQWorkplane {
        return this._wrap(this.wp.circle(r, false));
    }

    rectCentered(x: number, y: number): CQWorkplane {
        return this._wrap(this.wp.rect(x, y, true, false));
    }

    rectAll(x: number, y: number, centerAll: boolean | [boolean, boolean], forConstruction: boolean): CQWorkplane {
        return this._wrap(this.wp.rect(x, y, centerAll, forConstruction));
    }

    polygonSimple(nSides: number, diameter: number): CQWorkplane {
        return this._wrap(this.wp.polygon(nSides, diameter, false, false));
    }

    extrudeSimple(distance: number): CQWorkplane {
        // taper=undefined means no taper; passing 0 would trigger "Inner wires not allowed with tapered extrusion"
        return this._wrap(this.wp.extrude(distance, true, true, false, undefined));
    }

    revolveSimple(angleDeg: number): CQWorkplane {
        return this._wrap(this.wp.revolve(angleDeg, undefined, undefined, true, true));
    }

    /** revolveAboutAxis — an explicit axis line (world points). The kernel
     * converts the points with the workplane plane's frame, so callers pass
     * plane-LOCAL coordinates (the Go interpreter's revolveAxisLocal rule). */
    revolveAboutAxis(angleDeg: number, axisStart: { x: number; y: number; z: number }, axisEnd: { x: number; y: number; z: number }): CQWorkplane {
        return this._wrap(this.wp.revolve(angleDeg, axisStart, axisEnd, true, true));
    }

    loftSimple(): CQWorkplane {
        return this._wrap(this.wp.loft(false, true, true));
    }

    holeThrough(diameter: number): CQWorkplane {
        return this._wrap(this.wp.hole(diameter, undefined, true));
    }

    /** Argument order reversed vs underlying: CQWorkplane(taper, clean) → wp.cutThruAll(clean, taper) */
    cutThruAll(taper: number, clean: boolean): CQWorkplane {
        return this._wrap(this.wp.cutThruAll(clean, taper));
    }

    /** Maps centerOption int (0/1/2) to the underlying CenterOption enum. */
    workplane(
        offset: number, invert: boolean,
        centerOption?: number, origin?: any
    ): CQWorkplane {
        const coMap = [
            this.tp.CenterOption.CENTER_OF_MASS,
            this.tp.CenterOption.PROJECTED_ORIGIN,
            this.tp.CenterOption.CENTER_OF_BOUND_BOX,
        ];
        const co = centerOption != null ? coMap[centerOption] : undefined;
        return this._wrap(this.wp.create(offset, invert, co, origin));
    }

    split(keepTop: boolean, keepBottom: boolean): CQWorkplane {
        return this._wrap(this.wp.splitByPlane(keepTop, keepBottom));
    }

    transform(rotateGpVec: any, offsetGpVec: any): CQWorkplane {
        return this._wrap(this.wp.transformed(rotateGpVec, offsetGpVec));
    }

    mirror(planeName: string, basePnt?: any): CQWorkplane {
        return this._wrap(this.wp.mirror(planeName, basePnt, false));
    }

    mirrorWithName(planeName: string, basePnt: any, unionResult: boolean): CQWorkplane {
        return this._wrap(this.wp.mirror(planeName, basePnt, unionResult));
    }

    pushPointsWithVector(vectors: any[]): CQWorkplane {
        return this._wrap(this.wp.pushPoints(vectors));
    }

    rarray(
        xs: number, ys: number, xc: number, yc: number,
        centerX: boolean, centerY: boolean
    ): CQWorkplane {
        return this._wrap(this.wp.rarray(xs, ys, xc, yc, [centerX, centerY]));
    }

    /** Spline with CQ argument order (points, periodic, tangents, …). Underlying has different order. */
    spline(
        points: any[], periodic: boolean, tangents?: any[],
        scale?: boolean, tol?: number,
        forConstruction?: boolean, includeCurrent?: boolean, makeWire?: boolean
    ): CQWorkplane {
        return this._wrap(this.wp.spline(
            points, tangents ?? undefined, periodic, undefined,
            scale, tol, forConstruction, includeCurrent, makeWire
        ));
    }

    offset2D(d: number, kind: number, forConstruction: boolean): CQWorkplane {
        return this._wrap(this.wp.offset2d(d, kind, forConstruction));
    }

    /** Alias: value() == val() (Go-side naming). */
    value(): any {
        return this.wp.val();
    }
}
