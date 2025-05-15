import { BufferGeometry, Float32BufferAttribute, EdgesGeometry } from "three";
import { MeshCallback, MeshEdgeCallback } from "topo-wasm-binging";

export interface ThreeGeometry {
  faces: BufferGeometry;
  lines: BufferGeometry;
}

export class ThreeGeometryBuilder implements MeshCallback {
  private facesGeometry: BufferGeometry;
  private linesGeometry: BufferGeometry;
  private currentFaceIndex = 0;
  private vertices: number[] = [];
  private normals: number[] = [];
  private uvs: number[] = [];
  private triangles: number[] = [];
  private faceGroups: { start: number; count: number; faceId: number }[] = [];

  constructor() {
    this.facesGeometry = new BufferGeometry();
    this.linesGeometry = new BufferGeometry();
  }

  begin(): void {
    this.currentFaceIndex = 0;
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.triangles = [];
    this.faceGroups = [];
  }

  end(): void {
    this.facesGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(this.vertices, 3)
    );

    if (this.normals.length > 0) {
      this.facesGeometry.setAttribute(
        'normal',
        new Float32BufferAttribute(this.normals, 3)
      );
    } else {
      this.facesGeometry.computeVertexNormals();
    }

    if (this.uvs.length > 0) {
      this.facesGeometry.setAttribute(
        'uv',
        new Float32BufferAttribute(this.uvs, 2)
      );
    }

    this.facesGeometry.setIndex(this.triangles);

    if (this.faceGroups.length > 0) {
      this.facesGeometry.userData.faceGroups = this.faceGroups;
      this.faceGroups.forEach(({ start, count }) => {
        this.facesGeometry.addGroup(start, count, 0);
      });
    }

    // 自动生成边几何体
    this.linesGeometry.copy(new EdgesGeometry(this.facesGeometry, 2));
  }

  appendFace(r: number, g: number, b: number): number {
    const faceId = this.currentFaceIndex++;
    this.faceGroups.push({
      start: this.triangles.length,
      count: 0, // 将在appendTriangle中更新
      faceId
    });
    return faceId;
  }

  appendNode(faceIndex: number, x: number, y: number, z: number): void {
    this.vertices.push(x, y, z);
  }

  appendNodeWithNormal(
    faceIndex: number,
    x: number, y: number, z: number,
    nx: number, ny: number, nz: number
  ): void {
    this.appendNode(faceIndex, x, y, z);
    this.normals.push(nx, ny, nz);
  }

  appendNodeWithNormalAndUV(
    faceIndex: number,
    x: number, y: number, z: number,
    nx: number, ny: number, nz: number,
    u: number, v: number
  ): void {
    this.appendNodeWithNormal(faceIndex, x, y, z, nx, ny, nz);
    this.uvs.push(u, v);
  }

  appendTriangle(faceIndex: number, indices: [number, number, number]): void {
    this.triangles.push(...indices);
    const group = this.faceGroups.find(g => g.faceId === faceIndex);
    if (group) group.count += 3;
  }

  getGeometry(): ThreeGeometry {
    return {
      faces: this.facesGeometry,
      lines: this.linesGeometry
    };
  }
}

export class ThreeEdgeGeometryBuilder implements MeshEdgeCallback {
  private linesGeometry: BufferGeometry;
  private currentEdgeIndex = 0;
  private vertices: number[] = [];
  private edgeGroups: { start: number; count: number; edgeId: number }[] = [];

  constructor() {
    this.linesGeometry = new BufferGeometry();
  }

  begin(): void {
    this.currentEdgeIndex = 0;
    this.vertices = [];
    this.edgeGroups = [];
  }

  end(): void {
    this.linesGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(this.vertices, 3)
    );

    if (this.edgeGroups.length > 0) {
      this.linesGeometry.userData.edgeGroups = this.edgeGroups;
      this.edgeGroups.forEach(({ start, count }) => {
        this.linesGeometry.addGroup(start, count, 0);
      });
    }
  }

  appendEdge(r: number, g: number, b: number): number {
    const edgeId = this.currentEdgeIndex++;
    this.edgeGroups.push({
      start: this.vertices.length / 3,
      count: 0, // 将在appendNode中更新
      edgeId
    });
    return edgeId;
  }

  appendNode(edgeIndex: number, x: number, y: number, z: number): void {
    this.vertices.push(x, y, z);
    // 更新当前边组的顶点计数
    const group = this.edgeGroups.find(g => g.edgeId === edgeIndex);
    if (group) group.count += 1;
  }

  getGeometry(): BufferGeometry {
    return this.linesGeometry;
  }
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

export function highlightInGeometry(
  elements: number[],
  geometry: ThreeGeometry
): void {
  const groupIndices = new Set(elements);

  // @ts-expect-error types not up to date
  geometry.groups.forEach(
    (group: { materialIndex: number }, groupIndex: number) => {
      const shouldHighlight = groupIndices.has(groupIndex);
      const isHighlighted = group.materialIndex === 1;
      if (shouldHighlight === isHighlighted) return;

      group.materialIndex = shouldHighlight ? 1 : 0;

      // @ts-expect-error types not up to date
      geometry.groupsNeedUpdate = true;
    }
  );
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