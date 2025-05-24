
export declare type ShapeObjectType = {
    COMPOUND: {},
    COMPSOLID: {},
    SOLID: {},
    SHELL: {},
    FACE: {},
    WIRE: {},
    EDGE: {},
    VERTEX: {},
    SHAPE: {},
    VECTOR: {},
    LOCATION: {},
    SKETCH: {},
    BLANK: {}
}

export declare type CombineModeType = {
    CUT: {},
    ADDITIVE: {},
    SUBTRACTIVE: {}
}

export declare type CombineMode = CombineModeType | boolean;

export declare type CenterOption = {
    CENTER_OF_MASS: {},
    PROJECTED_ORIGIN: {},
    CENTER_OF_BOUND_BOX: {}
}

export declare type FaceIndexType = {
    CURRENT: {},
    NEXT: {}
}

declare type ShapeObject = Shape | Vector | Location | Sketch | null

declare class Workplane {
    constructor()
    constructor(planeOrName: PlaneName | TopoPlane, origin?: Vector, obj?: ShapeObject);

    static getShapeObjectType(obj: ShapeObject): ShapeObjectType;

    create(offset?: number, invert?: boolean, centerOption?: CenterOption, origin?: Vector): Workplane;

    splitByPlane(keepTop: boolean, keepBottom: boolean): Workplane;
    splitByShape(splitter: Shape): Workplane;
    splitByWorkplane(splitter: Workplane): Workplane;

    add(other: Workplane | ShapeObject | ShapeObject[]): Workplane;

    copy(): Workplane;
    fromTagged(name: string): Workplane;
    first(): Workplane;
    item(i: number): Workplane;
    last(): Workplane;
    end(n?: number): Workplane;
    clean(): Workplane;

    tag(name: string): Workplane;
    findSolid(searchStack?: boolean, searchParents?: boolean): Solid;

    vertices(selector?: string | Selector, tag?: string): Workplane;
    faces(selector?: string | Selector, tag?: string): Workplane;
    edges(selector?: string | Selector, tag?: string): Workplane;
    wires(selector?: string | Selector, tag?: string): Workplane;
    solids(selector?: string | Selector, tag?: string): Workplane;
    shells(selector?: string | Selector, tag?: string): Workplane;
    compounds(selector?: string | Selector, tag?: string): Workplane;

    ancestors(kind: TopAbsShapeEnum, tag?: string): Workplane;
    siblings(kind: TopAbsShapeEnum, level: number, tag?: string): Workplane;

    rotateAboutCenter(axisEndPoint: gp_Pnt, angleDegrees: number): Workplane;
    rotate(axisStartPoint: gp_Pnt, axisEndPoint: gp_Pnt, angleDegrees: number): Workplane;

    mirror(
        mirrorObj: PlaneName | gp_Vec | Face | Workplane,
        basePoint?: gp_Pnt,
        unionResult?: boolean
    ): Workplane;

    translate(vec: gp_Vec): Workplane;
    shell(thickness: number, kind: string): Workplane;
    fillet(radius: number): Workplane;
    chamfer(length: number, length2?: number): Workplane;
    transformed(rotate: gp_Vec, offset: gp_Vec): Workplane;

    rarray(
        xSpacing: number,
        ySpacing: number,
        xCount: number,
        yCount: number,
        center?: boolean | [boolean, boolean]
    ): Workplane;

    polarArray(
        radius: number,
        startAngle: number,
        angle: number,
        count: number,
        fill: boolean,
        rotate: boolean
    ): Workplane;

    pushPoints(points: Location[] | Vector[]): Workplane;

    center(x: number, y: number): Workplane;
    lineTo(x: number, y: number, forConstruction?: boolean): Workplane;
    bezier(
        points: Vector[],
        forConstruction: boolean,
        includeCurrent: boolean,
        makeWire: boolean
    ): Workplane;
    line(xDist: number, yDist: number, forConstruction: boolean): Workplane;
    vline(distance: number, forConstruction: boolean): Workplane;
    hline(distance: number, forConstruction: boolean): Workplane;
    vlineTo(yCoord: number, forConstruction: boolean): Workplane;
    hlineTo(xCoord: number, forConstruction: boolean): Workplane;
    polarLine(distance: number, angle: number, forConstruction: boolean): Workplane;
    polarLineTo(distance: number, angle: number, forConstruction: boolean): Workplane;
    moveTo(x: number, y: number): Workplane;
    move(xDist: number, yDist: number): Workplane;
    slot2d(length: number, diameter: number, angle: number): Workplane;

    spline(
        points: gp_Pnt[],
        tangents?: gp_Vec[],
        periodic?: boolean,
        parameters?: number[],
        scale?: boolean,
        tol?: number,
        forConstruction?: boolean,
        includeCurrent?: boolean,
        makeWire?: boolean
    ): Workplane;

    splineApprox(
        points: gp_Pnt[],
        minDeg: number,
        maxDeg: number,
        tol?: number,
        smoothing?: [number, number, number],
        forConstruction?: boolean,
        includeCurrent?: boolean,
        makeWire?: boolean
    ): Workplane;

    parametricCurve(
        func: (t: number) => gp_Pnt,
        N: number,
        start: number,
        stop: number,
        tol: number,
        minDeg: number,
        maxDeg: number,
        smoothing: [number, number, number],
        makeWire: boolean
    ): Workplane;

    parametricSurface(
        func: (u: number, v: number) => gp_Pnt,
        N: number,
        start: number,
        stop: number,
        tol: number,
        minDeg: number,
        maxDeg: number,
        smoothing: [number, number, number]
    ): Workplane;

    ellipseArc(
        x_radius: number,
        y_radius: number,
        angle1: number,
        angle2: number,
        rotation_angle: number,
        sense: number,
        forConstruction: boolean,
        startAtCurrent: boolean,
        makeWire: boolean
    ): Workplane;

    threePointArc(
        point1: gp_Pnt,
        point2: gp_Pnt,
        forConstruction?: boolean
    ): Workplane;

    sagittaArc(
        endPoint: gp_Pnt,
        sag: number,
        forConstruction: boolean
    ): Workplane;

    radiusArc(
        endPoint: gp_Pnt,
        radius: number,
        forConstruction: boolean
    ): Workplane;

    tangentArcPoint(
        endpoint: gp_Pnt,
        forConstruction: boolean,
        relative: boolean
    ): Workplane;

    mirrorY(): Workplane;
    mirrorX(): Workplane;
    consolidateWires(): Workplane;

    each(
        callback: (obj: ShapeObject) => ShapeObject,
        useLocalCoordinates?: boolean,
        combine?: boolean,
        clean?: boolean
    ): Workplane;

    eachPoint(
        arg: Shape | Workplane | ((loc: Location) => Shape),
        useLocalCoordinates?: boolean,
        combine?: boolean,
        clean?: boolean
    ): Workplane;

    rect(
        xLen: number,
        yLen: number,
        center?: boolean | [boolean, boolean],
        forConstruction?: boolean
    ): Workplane;

    circle(radius: number, forConstruction?: boolean): Workplane;
    ellipse(
        x_radius: number,
        y_radius: number,
        rotation_angle: number,
        forConstruction: boolean
    ): Workplane;
    polygon(
        nSides: number,
        diameter: number,
        forConstruction: boolean,
        circumscribed: boolean
    ): Workplane;
    polyline(
        points: gp_Pnt[],
        forConstruction?: boolean,
        includeCurrent?: boolean
    ): Workplane;
    close(): Workplane;
    wire(forConstruction?: boolean): Workplane;
    largestDimension(): number;

    cutEach(
        fcn: (loc: Location) => Shape,
        useLocalCoords: boolean,
        clean: boolean
    ): Workplane;

    cboreHole(
        diameter: number,
        cboreDiameter: number,
        cboreDepth: number,
        depth?: number,
        clean?: boolean
    ): Workplane;

    cskHole(
        diameter: number,
        cskDiameter: number,
        cskAngle: number,
        depth?: number,
        clean?: boolean
    ): Workplane;

    hole(
        diameter: number,
        depth?: number,
        clean?: boolean
    ): Workplane;

    twistExtrude(
        distance: number,
        angleDegrees: number,
        combine: boolean,
        clean: boolean
    ): Workplane;

    extrude(
        arg: number | Face | FaceIndexType,
        combine?: boolean | CombineModeType,
        clean?: boolean,
        both?: boolean,
        taper?: number
    ): Workplane;

    sweep(
        path: Workplane | Wire | Edge,
        multisection?: boolean,
        makeSolid?: boolean,
        isFrenet?: boolean,
        combine?: boolean,
        clean?: boolean,
        transition?: TransitionMode,
        normal?: Vector,
        auxSpine?: Workplane
    ): Workplane;

    union(
        other: Workplane | Solid | Compound,
        clean?: boolean,
        glue?: boolean,
        tol?: number
    ): Workplane;

    cut(
        other: Workplane | Solid | Compound,
        clean?: boolean,
        tol?: number
    ): Workplane;

    intersect(
        other: Workplane | Solid | Compound,
        clean?: boolean,
        tol?: number
    ): Workplane;


    cutBlind(
        until: number | Face | FaceIndexType,
        clean?: boolean,
        both?: boolean,
        taper?: number
    ): Workplane;

    revolve(
        angleDegrees: number,
        axisStart?: { x: number, y: number, z: number },
        axisEnd?: { x: number, y: number, z: number },
        combine?: boolean,
        clean?: boolean
    ): Workplane;

    interpPlate(
        edgesOrWp: Workplane | Edge[] | null,
        points: { x: number, y: number, z: number }[],
        thickness: number,
        combine?: boolean,
        clean?: boolean,
        degree?: number,
        nbPtsOnCur?: number,
        nbIter?: number,
        anisotropy?: boolean,
        tol2d?: number,
        tol3d?: number,
        tolAng?: number,
        tolCurv?: number,
        maxDeg?: number,
        maxSegments?: number
    ): Workplane;

    sphere(
        radius: number,
        direct?: { x: number, y: number, z: number },
        angle1?: number,
        angle2?: number,
        angle3?: number,
        center?: boolean | [boolean, boolean, boolean],
        combine?: boolean,
        clean?: boolean
    ): Workplane;

    cylinder(
        height: number,
        radius: number,
        direct?: { x: number, y: number, z: number },
        angle?: number,
        center?: boolean | [boolean, boolean, boolean],
        combine?: boolean,
        clean?: boolean
    ): Workplane;

    wedge(
        dx: number,
        dy: number,
        dz: number,
        xmin: number,
        zmin: number,
        xmax: number,
        zmax: number,
        pnt?: { x: number, y: number, z: number },
        dir?: { x: number, y: number, z: number },
        center?: boolean | [boolean, boolean, boolean],
        combine?: boolean,
        clean?: boolean
    ): Workplane;

    combine(clean: boolean, glue: boolean, tol?: number): Workplane;
    cutThruAll(clean: boolean, taper: number): Workplane;
    loft(ruled: boolean, combine: boolean, clean: boolean): Workplane;

    section(height?: number): Workplane;

    toPending(): Workplane;

    offset2d(d: number, kind?: GeomAbsJoinType, forConstruction?: boolean): Workplane;
    sketch(): Sketch;
    placeSketch(sketches?: Sketch[]): Workplane;

    at(index: number | number[] | [number, number]): Workplane;

    filter(predicate: (obj: ShapeObject) => boolean): Workplane;
    map(mapper: (obj: ShapeObject) => ShapeObject): Workplane;
    apply(applier: (objs: ShapeObject[]) => ShapeObject[]): Workplane;
    sort(comparator: (a: ShapeObject, b: ShapeObject) => boolean): Workplane;

    all(): Workplane[];
    shapes(): Shape[];
    vals(): ShapeObject[];
    val(): ShapeObject;
    size(): number;
    hasParent(): boolean;
    parent(): Workplane | null;
}