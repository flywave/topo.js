// The three.js glue is intentionally unchecked: every line here is a thin
// three.js API call; the editor's logic lives in core/ (fully typed).
// @ts-nocheck
// The three.js viewport (P3 framework): face meshes in, picking and
// highlight out. Knows nothing about runs/sessions — panels subscribe to
// core selection/artifacts.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Viewer-chrome styles (grid/axes/viewbar), injected once — the glue layer
// owns the viewport's own overlay chrome.
let chromeStyled = false;
function ensureChromeStyle() {
  if (chromeStyled) return;
  chromeStyled = true;
  const st = document.createElement("style");
  st.textContent = `
.viewer-toolbar { position:absolute; top:8px; left:8px; display:flex; gap:4px; z-index:5; }
.viewer-toolbar button { background:rgba(28,32,39,.88); color:#d8dde5; border:1px solid #2a3038;
  border-radius:4px; padding:2px 8px; font:12px system-ui,sans-serif; cursor:pointer; }
.viewer-toolbar button:hover { border-color:#4f8cff; }
.viewer-toolbar button.active { background:#2b3b57; border-color:#4f8cff; color:#fff; }
.viewer-axis-tip { position:absolute; z-index:5; background:rgba(28,32,39,.88); color:#d8dde5;
  border:1px solid #2a3038; border-radius:4px; padding:1px 6px; font:11px system-ui,sans-serif;
  pointer-events:none; display:none; }
`;
  document.head.appendChild(st);
}

export type ViewPreset = "iso" | "front" | "back" | "left" | "right" | "top" | "bottom";

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
  // ---- viewer chrome: grid + corner axis gizmo + view presets ----
  private grid: THREE.GridHelper | null = null;
  private gridVisible = true;
  private gizmoScene = new THREE.Scene();
  private gizmoCamera = new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 20);
  private gizmoSize = 92; // px
  private gizmoOn = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x14171c);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100000);
    // CAD convention: Z is up (sketches on XY extrude +Z) — the view presets
    // and the axis gizmo read this.
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(140, -140, 110);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    ensureChromeStyle();
    this.buildGrid();
    this.buildGizmo();
    this.buildToolbar(container);
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
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      this.renderer.setViewport(0, 0, w, h);
      this.renderer.setScissorTest(false);
      this.renderer.render(this.scene, this.camera);
      if (this.gizmoOn) {
        // The gizmo camera rides the main camera's direction: the corner
        // axes always read the CURRENT view orientation (iTwin-style).
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        this.gizmoCamera.position.copy(dir.multiplyScalar(8));
        this.gizmoCamera.up.copy(this.camera.up);
        this.gizmoCamera.lookAt(0, 0, 0);
        const gs = this.gizmoSize;
        this.renderer.clearDepth();
        this.renderer.setViewport(10, h - gs - 34, gs, gs);
        this.renderer.setScissor(10, h - gs - 34, gs, gs);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.gizmoScene, this.gizmoCamera);
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(0, 0, w, h);
      }
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
      // The grid sits under the model and spans ~2× its reach.
      if (this.grid) {
        const span = Math.max(size * 2, 40);
        this.grid.scale.setScalar(span / 240);
        this.grid.position.set(center.x, center.y, box.min.z);
      }
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

  // ------------------------------------------------------------------
  // Viewer chrome: grid, axis gizmo, view presets (iTwin-style standard
  // viewport features).
  // ------------------------------------------------------------------

  private buildGrid(): void {
    const grid = new THREE.GridHelper(240, 24, 0x3a424e, 0x242a33);
    // GridHelper lies in XZ; the CAD floor is XY (extrude +Z) — stand it up.
    grid.rotation.x = Math.PI / 2;
    grid.visible = this.gridVisible;
    this.grid = grid;
    this.scene.add(grid);
  }

  setGridVisible(visible: boolean): void {
    this.gridVisible = visible;
    if (this.grid) this.grid.visible = visible;
  }

  get isGridVisible(): boolean {
    return this.gridVisible;
  }

  // buildGizmo — the corner orientation gizmo: three positive axis arrows
  // with letter sprites, mirrored by dimmer negative stubs.
  private buildGizmo(): void {
    const mkLabel = (text: string, color: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      g.fillStyle = color;
      g.font = "bold 44px system-ui, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, 32, 34);
      const tex = new THREE.CanvasTexture(c);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
      sprite.scale.setScalar(0.62);
      return sprite;
    };
    const axis = (dir: [number, number, number], color: number, label: string, neg: boolean) => {
      const v = new THREE.Vector3(dir[0], dir[1], dir[2]);
      const mat = new THREE.LineBasicMaterial({ color: neg ? 0x555f6e : color, depthTest: false });
      const geom = new THREE.BufferGeometry().setFromPoints([
        neg ? v.clone().multiplyScalar(0.32) : new THREE.Vector3(),
        v.clone().multiplyScalar(neg ? 0.85 : 0.78),
      ]);
      this.gizmoScene.add(new THREE.Line(geom, mat));
      const tip = mkLabel(label, neg ? "#6b7686" : "#" + color.toString(16).padStart(6, "0"));
      tip.position.copy(v.clone().multiplyScalar(1.05));
      this.gizmoScene.add(tip);
    };
    axis([1, 0, 0], 0xe0554d, "X", false);
    axis([0, 1, 0], 0x51b06a, "Y", false);
    axis([0, 0, 1], 0x4f8cff, "Z", false);
    axis([-1, 0, 0], 0x888888, "X", true);
    axis([0, -1, 0], 0x888888, "Y", true);
    axis([0, 0, -1], 0x888888, "Z", true);
  }

  toggleGizmo(): boolean {
    this.gizmoOn = !this.gizmoOn;
    return this.gizmoOn;
  }

  // setViewPreset — snap the camera to a standard view, keeping the current
  // target and distance. Z-up presets: front looks from −Y, top from +Z.
  setViewPreset(preset: ViewPreset): void {
    const dirs: Record<ViewPreset, [number, number, number]> = {
      iso: [1, -1, 1], front: [0, -1, 0], back: [0, 1, 0],
      right: [1, 0, 0], left: [-1, 0, 0], top: [0, 0, 1], bottom: [0, 0, -1],
    };
    const ups: Record<ViewPreset, [number, number, number]> = {
      iso: [0, 0, 1], front: [0, 0, 1], back: [0, 0, 1],
      right: [0, 0, 1], left: [0, 0, 1], top: [0, 1, 0], bottom: [0, 1, 0],
    };
    const d = dirs[preset];
    const dist = Math.max(
      this.camera.position.distanceTo(this.controls.target),
      this.scene.children.length ? 120 : 120,
    );
    this.camera.up.set(ups[preset][0], ups[preset][1], ups[preset][2]);
    const v = new THREE.Vector3(d[0], d[1], d[2]).normalize().multiplyScalar(dist);
    this.camera.position.copy(this.controls.target).add(v);
    this.camera.lookAt(this.controls.target);
    this.controls.update();
  }

  // buildToolbar — the viewport's own overlay chrome: grid toggle + view
  // preset buttons (the CAD-standard quick switches).
  private buildToolbar(container: HTMLElement): void {
    const bar = document.createElement("div");
    bar.className = "viewer-toolbar";
    const gridBtn = document.createElement("button");
    gridBtn.textContent = "网格";
    gridBtn.title = "显示/关闭网格平面";
    gridBtn.classList.add("active");
    gridBtn.onclick = () => {
      this.setGridVisible(!this.gridVisible);
      gridBtn.classList.toggle("active", this.gridVisible);
    };
    bar.appendChild(gridBtn);
    const presets: Array<[ViewPreset, string, string]> = [
      ["iso", "轴测", "等轴测视图"], ["front", "前", "前视图"], ["top", "上", "俯视图"],
      ["right", "右", "右视图"], ["left", "左", "左视图"], ["back", "后", "后视图"],
    ];
    for (const [preset, label, title] of presets) {
      const b = document.createElement("button");
      b.textContent = label;
      b.title = title;
      b.onclick = () => this.setViewPreset(preset);
      bar.appendChild(b);
    }
    // hover tip for the gizmo (which corner object am I pointing at)
    const tip = document.createElement("div");
    tip.className = "viewer-axis-tip";
    container.appendChild(bar);
    container.appendChild(tip);
  }

  private resize(container: HTMLElement): void {
    const box = container.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    this.renderer.setSize(box.width, box.height);
    this.camera.aspect = box.width / box.height;
    this.camera.updateProjectionMatrix();
  }
}
