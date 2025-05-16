import type { Vertex, Edge, Wire, Face, Shell, Solid, CompSolid, Compound, Adaptor3d_Surface } from "topo-wasm";

import type {
    TopoDS_Face,
    TopoDS_Shape,
    TopoDS_Edge,
    TopoDS_Wire,
    TopoDS_Shell,
    TopoDS_Vertex,
    TopoDS_Solid,
    TopoDS_Compound,
    TopoDS_CompSolid,
    TopAbs_ShapeEnum,
} from "topo-wasm";
import { getTopo } from "./topolib";
import { WrappingObj } from "./register";
import { HASH_CODE_MAX } from "./constants";

export type {
    Vertex, Edge, Wire, Face, Shell, Solid, CompSolid, Compound
}

export type AnyShape =
    | Vertex
    | Edge
    | Wire
    | Face
    | Shell
    | Solid
    | CompSolid
    | Compound
    | null;

export type TopoEntity =
    | "vertex"
    | "edge"
    | "wire"
    | "face"
    | "shell"
    | "solid"
    | "solidCompound"
    | "compound"
    | "shape";

export type GenericTopo =
    | TopoDS_Vertex
    | TopoDS_Face
    | TopoDS_Shape
    | TopoDS_Edge
    | TopoDS_Wire
    | TopoDS_Shell
    | TopoDS_Vertex
    | TopoDS_Solid
    | TopoDS_Compound
    | TopoDS_CompSolid;

export const shapeType = (shape: TopoDS_Shape): TopAbs_ShapeEnum => {
    if (shape.IsNull()) throw new Error("This shape has not type, it is null");
    return shape.ShapeType();
};

export function downcast(shape: TopoDS_Shape): GenericTopo {
    const oc = getTopo();
    const ta = oc.TopAbs_ShapeEnum;

    const CAST_MAP = new Map([
        [ta.TopAbs_VERTEX, oc.TopoDS.Vertex_1],
        [ta.TopAbs_EDGE, oc.TopoDS.Edge_1],
        [ta.TopAbs_WIRE, oc.TopoDS.Wire_1],
        [ta.TopAbs_FACE, oc.TopoDS.Face_1],
        [ta.TopAbs_SHELL, oc.TopoDS.Shell_1],
        [ta.TopAbs_SOLID, oc.TopoDS.Solid_1],
        [ta.TopAbs_COMPSOLID, oc.TopoDS.CompSolid_1],
        [ta.TopAbs_COMPOUND, oc.TopoDS.Compound_1],
    ]);

    const myType = shapeType(shape);
    const caster = CAST_MAP.get(myType);
    if (!caster) throw new Error("Could not find a wrapper for this shape type");
    return caster(shape);
}

export function cast(shape: TopoDS_Shape): AnyShape {
    const oc = getTopo();
    return new oc.Shape(shape).autoCast();
}

export type Shape3D = Shell | Solid | CompSolid | Compound;

export function isShape3D(shape: AnyShape): shape is Shape3D {
    const oc = getTopo();
    return (
        shape instanceof oc.Shell ||
        shape instanceof oc.Solid ||
        shape instanceof oc.CompSolid ||
        shape instanceof oc.Compound
    );
}

export function isWire(shape: AnyShape): shape is Wire {
    const oc = getTopo();
    return shape instanceof oc.Wire;
}

export type SurfaceType =
    | "PLANE"
    | "CYLINDRE"
    | "CONE"
    | "SPHERE"
    | "TORUS"
    | "BEZIER_SURFACE"
    | "BSPLINE_SURFACE"
    | "REVOLUTION_SURFACE"
    | "EXTRUSION_SURFACE"
    | "OFFSET_SURFACE"
    | "OTHER_SURFACE";

export class Surface extends WrappingObj<Adaptor3d_Surface> {
    get surfaceType(): SurfaceType {
        const ga = this.oc.GeomAbs_SurfaceType;

        const CAST_MAP: Map<any, SurfaceType> = new Map([
            [ga.GeomAbs_Plane, "PLANE"],
            [ga.GeomAbs_Cylinder, "CYLINDRE"],
            [ga.GeomAbs_Cone, "CONE"],
            [ga.GeomAbs_Sphere, "SPHERE"],
            [ga.GeomAbs_Torus, "TORUS"],
            [ga.GeomAbs_BezierSurface, "BEZIER_SURFACE"],
            [ga.GeomAbs_BSplineSurface, "BSPLINE_SURFACE"],
            [ga.GeomAbs_SurfaceOfRevolution, "REVOLUTION_SURFACE"],
            [ga.GeomAbs_SurfaceOfExtrusion, "EXTRUSION_SURFACE"],
            [ga.GeomAbs_OffsetSurface, "OFFSET_SURFACE"],
            [ga.GeomAbs_OtherSurface, "OTHER_SURFACE"],
        ]);

        const shapeType = CAST_MAP.get(this.wrapped.GetType());
        if (!shapeType) throw new Error("surface type not found");
        return shapeType;
    }
}


const asTopo = (entity: TopoEntity): TopAbs_ShapeEnum => {
    const oc = getTopo();

    return {
        vertex: oc.TopAbs_ShapeEnum.TopAbs_VERTEX,
        wire: oc.TopAbs_ShapeEnum.TopAbs_WIRE,
        face: oc.TopAbs_ShapeEnum.TopAbs_FACE,
        shell: oc.TopAbs_ShapeEnum.TopAbs_SHELL,
        solid: oc.TopAbs_ShapeEnum.TopAbs_SOLID,
        solidCompound: oc.TopAbs_ShapeEnum.TopAbs_COMPSOLID,
        compound: oc.TopAbs_ShapeEnum.TopAbs_COMPOUND,
        edge: oc.TopAbs_ShapeEnum.TopAbs_EDGE,
        shape: oc.TopAbs_ShapeEnum.TopAbs_SHAPE,
    }[entity] as TopAbs_ShapeEnum;
};

export const iterTopo = function* iterTopo(
    shape: TopoDS_Shape,
    topo: TopoEntity
): IterableIterator<TopoDS_Shape> {
    const oc = getTopo();
    const explorer = new oc.TopExp_Explorer_2(
        shape,
        asTopo(topo),
        asTopo("shape")
    );
    const hashes = new Map();
    while (explorer.More()) {
        const item = explorer.Current();
        const hash = item.HashCode(HASH_CODE_MAX as any);
        if (!hashes.get(hash)) {
            hashes.set(hash, true);
            yield item;
        }
        explorer.Next();
    }
    explorer.delete();
};


function _iterTopo(shape: GenericTopo, topo: TopoEntity): IterableIterator<TopoDS_Shape> {
    return iterTopo(shape, topo);
}

export function listTopo(shape: GenericTopo, topo: TopoEntity): TopoDS_Shape[] {
    return Array.from(_iterTopo(shape, topo)).map((e) => {
        return downcast(e);
    });
}


export function getEdges(shape: GenericTopo): Edge[] {
    const oc = getTopo();
    return listTopo(shape, "edge").map((e) => new oc.Edge(e));
}

export function getFaces(shape: GenericTopo): Face[] {
    const oc = getTopo();
    return listTopo(shape, "face").map((e) => new oc.Face(e));
}

export function getWires(shape: GenericTopo): Wire[] {
    const oc = getTopo();
    return listTopo(shape, "wire").map((e) => new oc.Wire(e));
}
