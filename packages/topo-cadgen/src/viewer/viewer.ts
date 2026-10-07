// The three.js glue is intentionally unchecked: every line here is a thin
// three.js API call; the editor's logic lives in core/ (fully typed).
// @ts-nocheck
// The three.js viewport (P3 framework): face meshes in, picking and
// highlight out. Knows nothing about runs/sessions — panels subscribe to
// core selection/artifacts.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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
  private edgeLines: THREE.Line[] = [];
  private pickHandler: ((faceId: number) => void) | null = null;
  private edgePickHandler: ((edgeId: number) => void) | null = null;
  private container: HTMLElement;
  /** The assembly view's objects (GLB scene), kept apart from the part
   * mesh so the two views can replace each other cleanly. */
  private assemblyObjects: THREE.Object3D[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x14171c);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    // Lights: MeshStandardMaterial is black without any — hemisphere for the
    // base tone, a directional for shape-defining shading.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(1, 1.6, 0.8);
    this.scene.add(sun);

    this.renderer.domElement.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || !this.pickHandler) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      const p = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(p, this.camera);
      // EDGES FIRST: an edge lies exactly ON faces, so a face-first raycast
      // would win every time and edge picking could never fire (observed
      // live). The line threshold gives the edge a small capture zone; only
      // a clean miss falls through to the face beneath.
      ray.params.Line = { threshold: Math.max(2.5, this.camera.position.distanceTo(this.controls.target) * 0.02) };
      const edgeHits = ray.intersectObjects(this.edgeLines, false);
      if (edgeHits.length && edgeHits[0].object.userData.edgeId !== undefined) {
        this.edgePickHandler?.(edgeHits[0].object.userData.edgeId as number);
        return;
      }
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

  onEdgePick(handler: (edgeId: number) => void): void {
    this.edgePickHandler = handler;
  }

  // setEdges — the topology's sampled polylines as a pickable overlay.
  setEdges(edges: Array<{ id: number; points: number[][] }> | null): void {
    this.edgeLines.forEach((l) => {
      this.scene.remove(l);
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.edgeLines = [];
    if (!edges) return;
    for (const e of edges) {
      if (!e.points || e.points.length < 2) continue;
      const geom = new THREE.BufferGeometry().setFromPoints(
        e.points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      );
      const mat = new THREE.LineBasicMaterial({ color: 0x222831 });
      const line = new THREE.Line(geom, mat);
      line.userData.edgeId = e.id;
      this.edgeLines.push(line);
      this.scene.add(line);
    }
  }

  // highlightEdges — paint the picked edge(s); called with an empty set to
  // clear. Non-selected edges keep their base colour.
  highlightEdges(selectedEdgeIds: Set<number>): void {
    this.edgeLines.forEach((l) => {
      (l.material as THREE.LineBasicMaterial).color.set(
        selectedEdgeIds.has(l.userData.edgeId as number) ? 0xff8830 : 0x222831,
      );
    });
  }

  setMesh(mesh: MeshData | null): void {
    this.faceMeshes.forEach((m) => {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.faceMeshes = [];
    this.edgeLines.forEach((l) => {
      this.scene.remove(l);
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.edgeLines = [];
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
    this.resize(this.container);
  }

  // showAssemblyGLB — replace the viewport with a parsed glTF scene (the
  // assembly view). The part mesh/edges stay in the scene graph but hidden,
  // so returning to the part view is a visibility flip, not a rebuild.
  showAssemblyGLB(glb: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      new GLTFLoader().parse(glb, "", (gltf) => {
        this.setPartVisible(false);
        const box = new THREE.Box3();
        gltf.scene.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            const m = o as THREE.Mesh;
            if (m.material && !(Array.isArray(m.material))) {
              (m.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
            }
          }
        });
        gltf.scene.updateMatrixWorld(true);
        box.setFromObject(gltf.scene);
        this.scene.add(gltf.scene);
        this.assemblyObjects = [gltf.scene];
        if (!box.isEmpty()) this.frameBox(box);
        this.resize(this.container);
        resolve();
      }, (err) => reject(err instanceof Error ? err : new Error(String(err))));
    });
  }

  // showPart — back from the assembly view: hide the GLB objects, restore
  // the part mesh/edges.
  showPart(): void {
    this.assemblyObjects.forEach((o) => this.scene.remove(o));
    this.assemblyObjects = [];
    this.setPartVisible(true);
    this.resize(this.container);
  }

  get assemblyShown(): boolean {
    return this.assemblyObjects.length > 0;
  }

  private setPartVisible(visible: boolean): void {
    this.faceMeshes.forEach((m) => (m.visible = visible));
    this.edgeLines.forEach((l) => (l.visible = visible));
  }

  private frameBox(box: THREE.Box3): void {
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    this.camera.position.set(center.x + size, center.y + size * 0.6, center.z + size);
    this.controls.target.copy(center);
    this.camera.near = size / 1000;
    this.camera.far = size * 100;
    this.camera.updateProjectionMatrix();
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
