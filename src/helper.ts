import { MeshStandardMaterial, Color, Geometry, Mesh, Scene } from 'three';
import openCascadeHelper from './three'; // Adjust the import path as needed

interface FaceData {
  vertex_coord: number[];
  normal_coord: number[];
  tri_indexes: number[];
  number_of_triangles: number;
}

const addShapeToScene = async (
  openCascade: any,
  shape: any, // Replace 'any' with more specific type if possible
  scene: Scene
): Promise<void> => {
  openCascadeHelper.setOpenCascade(openCascade);
  const facelist: FaceData[] = await openCascadeHelper.tessellate(shape);
  const [locVertexcoord, locNormalcoord, locTriIndices] = await openCascadeHelper.joinPrimitives(facelist);
  const tot_triangle_count: number = facelist.reduce((a, b) => a + b.number_of_triangles, 0);
  const [vertices, faces] = await openCascadeHelper.generateGeometry(
    tot_triangle_count,
    locVertexcoord,
    locNormalcoord,
    locTriIndices
  );

  const objectMat = new MeshStandardMaterial({
    color: new Color(0.9, 0.9, 0.9)
  });
  
  const geometry = new Geometry();
  geometry.vertices = vertices;
  geometry.faces = faces;
  
  const object = new Mesh(geometry, objectMat);
  object.name = "shape";
  object.rotation.x = -Math.PI / 2;
  
  scene.add(object);
};

export { addShapeToScene };