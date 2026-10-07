// The three.js glue is intentionally unchecked: every line here is a thin
// three.js API call; the editor's logic lives in core/ (fully typed).
// @ts-nocheck
// The three.js viewport (P3 framework): face meshes in, picking and
// highlight out. Knows nothing about runs/sessions — panels subscribe to
// core selection/artifacts.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export interface MeshData {
  vertices: number[][];
  triangles: number[][];
}

export class Viewer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  private faceMeshes: THREE.Mesh[] = [];
  private pickHandler: ((faceId: number) => void) | null = null;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x14171c);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.renderer.domElement.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || !this.pickHandler) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      const p = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(p, this.camera);
      const hits = ray.intersectObjects(this.faceMeshes, false);
      if (hits.length && hits[0].object.userData.faceId !== undefined) {
        this.pickHandler(hits[0].object.userData.faceId as number);
      }
    });

    new ResizeObserver(() => this.resize(container)).observe(container);
    this.resize(container);
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  onFacePick(handler: (faceId: number) => void): void {
    this.pickHandler = handler;
  }

  setMesh(mesh: MeshData | null): void {
    this.faceMeshes.forEach((m) => {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.faceMeshes = [];
    if (!mesh) return;
    const box = new THREE.Box3();
    const base = new THREE.MeshStandardMaterial({ color: 0x8fa3bf, metalness: 0.1, roughness: 0.65, side: THREE.DoubleSide });
    mesh.vertices.forEach((face, faceId) => {
      if (face.length < 9) return;
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(face, 3));
      const idx = mesh.triangles[faceId] || [];
      if (idx.length) geom.setIndex(idx);
      geom.computeVertexNormals();
      const m = new THREE.Mesh(geom, base.clone());
      m.userData.faceId = faceId;
      this.faceMeshes.push(m);
      this.scene.add(m);
      box.expandByObject(m);
    });
    if (!box.isEmpty()) {
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());
      this.camera.position.set(center.x + size, center.y + size * 0.6, center.z + size);
      this.controls.target.copy(center);
      this.camera.near = size / 1000;
      this.camera.far = size * 100;
      this.camera.updateProjectionMatrix();
    }
    this.resize();
  }

  // highlight — paint the faces of the selected feature; the rest base.
  highlight(selectedFaceIds: Set<number>): void {
    this.faceMeshes.forEach((m, i) => {
      (m.material as THREE.MeshStandardMaterial).color.set(
        selectedFaceIds.has(i) ? 0x4f8cff : 0x8fa3bf,
      );
    });
  }

  private resize(container: HTMLElement): void {
    const box = container.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    this.renderer.setSize(box.width, box.height);
    this.camera.aspect = box.width / box.height;
    this.camera.updateProjectionMatrix();
  }
}
