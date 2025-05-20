import { BufferGeometry, Float32BufferAttribute, EdgesGeometry, BufferAttribute } from "three";
import { EdgeData, MeshData } from "topo-wasm";

export function createGeometryFromMeshData(data: MeshData | null): Array<BufferGeometry> {
  const geometries: BufferGeometry[] = [];

  if (!data) {
    return geometries;
  }

  // 为每个面组创建独立的几何体
  data.faceGroups.forEach(({ faceId, start, count }) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(data.vertices[faceId], 3));

    if (data.normals && data.normals[faceId].length > 0) {
      geometry.setAttribute('normal', new Float32BufferAttribute(data.normals[faceId], 3));
    } else {
      geometry.computeVertexNormals();
    }

    if (data.uvs && data.uvs[faceId].length > 0) {
      geometry.setAttribute('uv', new Float32BufferAttribute(data.uvs[faceId], 2));
    }

    geometry.setIndex(data.triangles[faceId]);
    geometries.push(geometry);
  });

  return geometries;
}

export function createGeometryFromEdgeData(data: EdgeData | null): Array<BufferGeometry> {
  const geometries: BufferGeometry[] = [];

  if (!data) {
    return geometries;
  }

  // 为每个边组创建独立的几何体
  data.edgeGroups.forEach(({ edgeId, start, count }) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(data.lines[edgeId], 3));
    geometries.push(geometry);
  });

  return geometries;
}

export function syncLinesFromFaces(
  lines: BufferGeometry,
  faces: BufferGeometry
) {
  lines.clearGroups();
  delete lines.userData.edgeGroups;

  lines.copy(new EdgesGeometry(faces, 2));
}

const groupFinder =
  (faceIndex: number) =>
    ({ start, count }: { start: number; count: number }) => {
      return faceIndex >= start && faceIndex < start + count;
    };

export function toggleHighlight(
  groupIndex: number,
  geometry: BufferGeometry
): void {
  const group = geometry.groups.find(groupFinder(groupIndex));
  if (group) {
    group.materialIndex = group.materialIndex ? 0 : 1;
    // @ts-expect-error types not up to date
    geometry.groupsNeedUpdate = true;
  }
}

export function clearHighlights(geometry: BufferGeometry): void {
  geometry.groups.forEach((g) => {
    if (g.materialIndex !== 0) {
      // @ts-expect-error types not up to date
      geometry.groupsNeedUpdate = true;
      g.materialIndex = 0;
    }
  });
}

export function getFaceId(
  triangleIndex: number,
  geometry: BufferGeometry
): number {
  const { faceId } =
    geometry.userData.faceGroups.find(groupFinder(triangleIndex * 3)) || {};
  return faceId;
}

export function getEdgeId(lineIndex: number, geometry: BufferGeometry): number {
  const { edgeId } =
    geometry.userData.edgeGroups.find(groupFinder(lineIndex)) || {};
  return edgeId;
}

export function getFaceIndex(
  triangleIndex: number,
  geometry: BufferGeometry
): number {
  return geometry.groups.findIndex(groupFinder(triangleIndex * 3));
}

export function getEdgeIndex(
  lineIndex: number,
  geometry: BufferGeometry
): number {
  return geometry.groups.findIndex(groupFinder(lineIndex));
}
