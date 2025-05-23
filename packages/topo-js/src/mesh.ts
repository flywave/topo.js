import { Shape, TopoDS_Shape, TopoInstance, TopAbs_ShapeEnum } from "topo-wasm";
import { createGeometryFromMeshData, createGeometryFromEdgeData } from "topo-threejs";
import { getTopo } from "./topolib";
import { BufferGeometry, NormalBufferAttributes, BufferAttribute } from "three";

export function mesh(shp: Shape, precision?: number, deflection?: number, angle?: number, uvCoords?: boolean): Array<BufferGeometry> {
    const oc = getTopo();
    const mdata = shp.mesh(precision, deflection, angle, uvCoords);
    return createGeometryFromMeshData(mdata);
}

export function meshEdges(shp: Shape, precision?: number, angle?: number): Array<BufferGeometry> {
    const oc = getTopo();
    const edata = shp.meshEdges(precision, angle);
    return createGeometryFromEdgeData(edata);
}


export function getBufferGeometryFromShape(
    shape: TopoDS_Shape,
    openCascade: TopoInstance
): BufferGeometry<NormalBufferAttributes>[] {
    let geometries: Array<BufferGeometry<NormalBufferAttributes>> = []
    const ExpFace = new openCascade.TopExp_Explorer_1()
    for (
        ExpFace.Init(
            shape,
            openCascade.TopAbs_ShapeEnum.TopAbs_FACE as any,
            openCascade.TopAbs_ShapeEnum.TopAbs_SHAPE as any
        );
        ExpFace.More();
        ExpFace.Next()
    ) {
        const myShape = ExpFace.Current()
        const myFace = openCascade.TopoDS.Face_1(myShape)
        let inc
        try {
            inc = new openCascade.BRepMesh_IncrementalMesh_2(
                myFace,
                0.1,
                false,
                0.5,
                false
            )
        } catch (e) {
            console.error("face visualizi<ng failed")
            continue
        }

        const aLocation = new openCascade.TopLoc_Location_1()
        const myT = openCascade.BRep_Tool.Triangulation(
            myFace,
            aLocation,
            openCascade.Poly_MeshPurpose
        )
        if (myT.IsNull()) {
            continue
        }

        const pc = new openCascade.Poly_Connect_2(myT)
        const triangulation = myT.get()

        let vertices = new Float32Array(triangulation.NbNodes() * 3)

        // write vertex buffer
        for (let i = 1; i <= triangulation.NbNodes(); i++) {
            const t1 = aLocation.Transformation()
            const p = triangulation.Node(i)
            const p1 = p.Transformed(t1)
            vertices[3 * (i - 1)] = p1.X()
            vertices[3 * (i - 1) + 1] = p1.Y()
            vertices[3 * (i - 1) + 2] = p1.Z()
            p.delete()
            t1.delete()
            p1.delete()
        }

        // write normal buffer
        const myNormal = new openCascade.TColgp_Array1OfDir_2(
            1,
            triangulation.NbNodes()
        )
        //openCascade.StdPrs_ToolTriangulatedShape.Normal(myFace, pc, myNormal)

        let normals = new Float32Array(myNormal.Length() * 3)
        for (let i = myNormal.Lower(); i <= myNormal.Upper(); i++) {
            const t1 = aLocation.Transformation()
            const d1 = myNormal.Value(i)
            const d = d1.Transformed(t1)

            normals[3 * (i - 1)] = d.X()
            normals[3 * (i - 1) + 1] = d.Y()
            normals[3 * (i - 1) + 2] = d.Z()

            t1.delete()
            d1.delete()
            d.delete()
        }

        myNormal.delete()

        // write triangle buffer
        const orient = myFace.Orientation_1()
        const triangles = myT.get().Triangles()
        let indices
        let triLength = triangles.Length() * 3
        if (triLength > 65535) indices = new Uint32Array(triLength)
        else indices = new Uint16Array(triLength)

        for (let nt = 1; nt <= myT.get().NbTriangles(); nt++) {
            const t = triangles.Value(nt)
            let n1 = t.Value(1)
            let n2 = t.Value(2)
            let n3 = t.Value(3)
            if (orient !== openCascade.TopAbs_Orientation.TopAbs_FORWARD) {
                let tmp = n1
                n1 = n2
                n2 = tmp
            }

            indices[3 * (nt - 1)] = n1 - 1
            indices[3 * (nt - 1) + 1] = n2 - 1
            indices[3 * (nt - 1) + 2] = n3 - 1
            t.delete()
        }
        triangles.delete()

        let geometry = new BufferGeometry()
        geometry.setAttribute("position", new BufferAttribute(vertices, 3))
        geometry.setAttribute("normal", new BufferAttribute(normals, 3))

        geometry.setIndex(new BufferAttribute(indices, 1))
        geometries.push(geometry)

        pc.delete()
        aLocation.delete()
        myT.delete()
        inc.delete()
        myFace.delete()
        myShape.delete()
    }
    ExpFace.delete()
    return geometries
}