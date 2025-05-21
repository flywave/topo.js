import {
    Geom_CylindricalSurface,
    gp_GTrsf2d,
    Handle_Geom_Surface,
    Plane,
    ShapeGeomType,
    Orientation,
} from "topo-wasm";

import { GCWithScope, localGC, WrappingObj } from "./register";
import { getTopo } from "./topolib";

import { Edge, Face } from "./shapes";
import { makeAx2 } from "./geom";
import { axis2d, pnt, Point2D, vec, BoundingBox2d, Curve2D } from "./lib2d";

export const curvesBoundingBox = (curves: Curve2D[]): BoundingBox2d => {
    const oc = getTopo();
    const boundBox = new oc.Bnd_Box2d();

    curves.forEach((c) => {
        oc.BndLib_Add2dCurve.Add_3(c.wrapped, 1e-6, boundBox);
    });

    return new BoundingBox2d(boundBox);
};

export function curvesAsEdgesOnPlane(curves: Curve2D[], plane: Plane) {
    const [r, gc] = localGC();
    const ax = r(makeAx2(plane.origin(), plane.zDir(), plane.xDir()));

    const oc = getTopo();

    const edges = curves.map((curve) => {
        const curve3d = oc.GeomLib.To3d(ax, curve.wrapped);
        return new oc.Edge(new oc.BRepBuilderAPI_MakeEdge_24(curve3d).Edge());
    });

    gc();
    return edges;
}

export const curvesAsEdgesOnSurface = (
    curves: Curve2D[],
    geomSurf: Handle_Geom_Surface
) => {
    const [r, gc] = localGC();
    const oc = getTopo();

    const modifiedCurves = curves.map((curve) => {
        const edgeBuilder = r(
            new oc.BRepBuilderAPI_MakeEdge_30(curve.wrapped, geomSurf)
        );
        return new oc.Edge(edgeBuilder.Edge());
    });

    gc();
    return modifiedCurves;
};

export const transformCurves = (
    curves: Curve2D[],
    transformation: gp_GTrsf2d | null
): Curve2D[] => {
    const oc = getTopo();

    const modifiedCurves = curves.map((curve) => {
        if (!transformation) return curve.clone();
        return new Curve2D(oc.GeomLib.GTransform(curve.wrapped, transformation));
    });

    return modifiedCurves;
};

export class Transformation2D extends WrappingObj<gp_GTrsf2d> {
    transformCurves(curves: Curve2D[]) {
        return transformCurves(curves, this.wrapped);
    }
}

export const stretchTransform2d = (
    ratio: number,
    direction: Point2D,
    origin: Point2D = [0, 0]
): Transformation2D => {
    const oc = getTopo();
    const axis = axis2d(origin, direction);
    const transform = new oc.gp_GTrsf2d_1();
    transform.SetAffinity(axis, ratio);

    axis.delete();
    return new Transformation2D(transform);
};

export const translationTransform2d = (
    translation: Point2D
): Transformation2D => {
    const oc = getTopo();
    const [r, gc] = localGC();

    const rotation = new oc.gp_Trsf2d_1();
    rotation.SetTranslation_1(r(vec(translation)));

    const transform = new oc.gp_GTrsf2d_2(rotation);
    gc();
    return new Transformation2D(transform);
};

export const mirrorTransform2d = (
    centerOrDirection: Point2D,
    origin: Point2D = [0, 0],
    mode = "center"
): Transformation2D => {
    const oc = getTopo();
    const [r, gc] = localGC();

    const rotation = new oc.gp_Trsf2d_1();
    if (mode === "center") {
        rotation.SetMirror_1(r(pnt(centerOrDirection)));
    } else {
        rotation.SetMirror_2(r(axis2d(origin, centerOrDirection)));
    }

    const transform = new oc.gp_GTrsf2d_2(rotation);
    gc();
    return new Transformation2D(transform);
};

export const rotateTransform2d = (
    angle: number,
    center: Point2D = [0, 0]
): Transformation2D => {
    const oc = getTopo();
    const [r, gc] = localGC();

    const rotation = new oc.gp_Trsf2d_1();
    rotation.SetRotation(r(pnt(center)), angle);

    const transform = new oc.gp_GTrsf2d_2(rotation);
    gc();
    return new Transformation2D(transform);
};

export const scaleTransform2d = (
    scaleFactor: number,
    center: Point2D = [0, 0]
): Transformation2D => {
    const oc = getTopo();
    const [r, gc] = localGC();

    const scaling = new oc.gp_Trsf2d_1();
    scaling.SetScale(r(pnt(center)), scaleFactor);

    const transform = new oc.gp_GTrsf2d_2(scaling);
    gc();
    return new Transformation2D(transform);
};

export function faceRadius(face: Face): null | number {
    const oc = getTopo();
    const [r, gc] = localGC();
    const geomSurf = r(oc.BRep_Tool.Surface_2(face.value()));

    if (face.geomType() !== oc.ShapeGeomType.CYLINDER) return null;

    const cylinder = r((geomSurf.get() as Geom_CylindricalSurface).Cylinder());
    const radius = cylinder.Radius();
    gc();
    return radius;
}

export type ScaleMode = "original" | "bounds" | "native";

export function curvesAsEdgesOnFace(
    curves: Curve2D[],
    face: Face,
    scale: ScaleMode = "original"
) {
    const [r, gc] = localGC();

    const oc = getTopo();
    let geomSurf = r(oc.BRep_Tool.Surface_2(face.value()));

    const bounds = face.uvBounds();
    const [uMin, uMax, vMin, vMax] = bounds;

    let transformation: null | gp_GTrsf2d = null;
    const uAxis = r(axis2d([0, 0], [0, 1]));
    const vAxis = r(axis2d([0, 0], [1, 0]));

    if (scale === "original" && face.geomType() !== oc.ShapeGeomType.PLANE) {
        if (face.geomType() !== oc.ShapeGeomType.CYLINDER)
            throw new Error(
                "Only planar and cylidrical faces can be unwrapped for sketching"
            );

        const cylinder = r((geomSurf.get() as Geom_CylindricalSurface).Cylinder());
        if (!cylinder.Direct()) {
            geomSurf = geomSurf.get().UReversed();
        }
        const radius = cylinder.Radius();
        const affinity = stretchTransform2d(1 / radius, [0, 1]);
        transformation = affinity.wrapped;
    }

    if (scale === "bounds") {
        transformation = r(new oc.gp_GTrsf2d_1());
        transformation.SetAffinity(uAxis, uMax - uMin);

        if (uMin !== 0) {
            const translation = r(new oc.gp_GTrsf2d_1());
            translation.SetTranslationPart(new oc.gp_XY_2(0, -uMin));
            transformation.Multiply(translation);
        }

        const vTransformation = r(new oc.gp_GTrsf2d_1());
        vTransformation.SetAffinity(vAxis, vMax - vMin);
        transformation.Multiply(vTransformation);

        if (vMin !== 0) {
            const translation = r(new oc.gp_GTrsf2d_1());
            translation.SetTranslationPart(r(new oc.gp_XY_2(0, -vMin)));
            transformation.Multiply(translation);
        }
    }

    const modifiedCurves = transformCurves(curves, transformation);
    const edges = curvesAsEdgesOnSurface(modifiedCurves, geomSurf);

    gc();
    return edges;
}

export function edgeToCurve(e: Edge, face: Face): Curve2D {
    const oc = getTopo();
    const r = GCWithScope();

    const adaptor = r(new oc.BRepAdaptor_Curve2d_2(e.value(), face.value()));

    const trimmed = new oc.Geom2d_TrimmedCurve(
        adaptor.Curve(),
        adaptor.FirstParameter(),
        adaptor.LastParameter(),
        true,
        true
    );

    if (e.getOrientation() === oc.Orientation.REVERSED) {
        trimmed.Reverse();
    }

    return new Curve2D(new oc.Handle_Geom2d_Curve_2(trimmed));
}