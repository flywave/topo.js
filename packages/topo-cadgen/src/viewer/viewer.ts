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
.viewer-measure-tip { position:absolute; bottom:10px; left:50%; transform:translateX(-50%);
  z-index:5; background:rgba(28,32,39,.92); color:#ffe2a8; border:1px solid #4f8cff;
  border-radius:4px; padding:2px 10px; font:12px system-ui,sans-serif; pointer-events:none;
  display:none; white-space:nowrap; }
.viewer-measure-label { position:absolute; z-index:6; transform:translate(-50%,-130%);
  background:rgba(24,27,33,.95); color:#ffd24a; border:1px solid #ffd24a;
  border-radius:3px; padding:1px 7px; font:bold 12px ui-monospace,SFMono-Regular,Consolas,monospace;
  pointer-events:none; display:none; white-space:nowrap; box-shadow:0 1px 4px rgba(0,0,0,.5); }
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
  // ---- viewer chrome: grid + view cube + view presets ----
  private grid: THREE.GridHelper | null = null;
  private gridVisible = true;
  private gizmoScene = new THREE.Scene();
  private gizmoCamera = new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 20);
  private gizmoSize = 92; // px
  private gizmoOn = true;
  private viewCube: THREE.Mesh | null = null;
  /** The gizmo viewport's screen rect (top-right), for pointer mapping. */
  private cubeRect = { left: 0, top: 0, size: 92 };
  private cubeHover = -1; // materialIndex, −1 = none
  private cubeFaceNames = ["右", "左", "后", "前", "上", "下"];
  private cubePresets = ["right", "left", "back", "front", "top", "bottom"];
  // ---- measure mode: click two points on the model, read the distance ----
  private measuring = false;
  private measurePts: THREE.Vector3[] = [];
  private measureMarks: THREE.Object3D[] = [];
  private measureBtn: HTMLButtonElement | null = null;
  // the CAD dimension display: dashed helper line + the value chip riding
  // its midpoint (screen-projected every frame, so it tracks orbit/zoom)
  private measureLabel: HTMLDivElement | null = null;
  private measureAnchor: THREE.Vector3 | null = null;
  // ---- selection mode: 点/边/面 are picked in DISJOINT modes — the mixed
  // edge-first capture made faces steal edge clicks and neither reliable.
  private selectMode: "vertex" | "edge" | "face" = "face";
  private selectButtons: Record<"vertex" | "edge" | "face", HTMLButtonElement | null> = {
    vertex: null, edge: null, face: null,
  };
  // vertex overlay: deduped topology edge endpoints, pickable as a Points cloud
  private vertexCloud: THREE.Points | null = null;
  private vertexPositions: Array<[number, number, number]> = [];
  private vertexPickHandler: ((vertexId: number) => void) | null = null;
  private vertexMarker: THREE.Mesh | null = null;
  // drag loop (docs/drag-loop.md M2): a grabbed vertex follows the pointer
  // projected onto its sketch plane; release hands the (u, v) target back.
  private dragStartHandler: ((vertexId: number) => boolean) | null = null;
  private dragActive = false;
  private dragPlaneFrame: { origin: [number, number, number]; ex: number[]; ey: number[]; n: number[] } | null = null;
  private dragPlaneHelper: THREE.Mesh | null = null;
  private dragMarker: THREE.Mesh | null = null;
  private dragMoveHandler: ((u: number, v: number) => void) | null = null;
  private dragEndHandler: ((u: number, v: number) => void) | null = null;
  private dragPreview: THREE.LineSegments | null = null;
  // 拾取抢占修复: when a sketch is the drag context, the cloud shows ONLY
  // that sketch's endpoints (the z-mirror topology corners stop stealing
  // the pick). null = all topology corners (previous behaviour).
  private vertexFilterPoints: Array<[number, number, number]> | null = null;
  private activeVertexPositions: Array<[number, number, number]> = [];
  private meshReframe = false;

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
    ensureChromeStyle();
    this.buildGrid();
    this.buildViewCube();
    this.buildToolbar(container);
    // Cube interaction: hover highlight + click-to-snap (a clean click on a
    // face; anything that moved is an orbit drag owned by OrbitControls).
    let downAt: { x: number; y: number; face: number } | null = null;
    this.renderer.domElement.addEventListener("mousemove", (ev) => {
      this.lastPointer = { x: ev.clientX, y: ev.clientY };
      if (this.dragActive) {
        const uv = this.screenToSketch(ev.clientX, ev.clientY);
        if (uv) {
          this.dragMoveHandler?.(uv[0], uv[1]);
          if (this.dragMarker) this.dragMarker.position.set(
            this.dragPlaneFrame!.origin[0] + this.dragPlaneFrame!.ex[0] * uv[0] + this.dragPlaneFrame!.ey[0] * uv[1],
            this.dragPlaneFrame!.origin[1] + this.dragPlaneFrame!.ex[1] * uv[0] + this.dragPlaneFrame!.ey[1] * uv[1],
            this.dragPlaneFrame!.origin[2] + this.dragPlaneFrame!.ex[2] * uv[0] + this.dragPlaneFrame!.ey[2] * uv[1],
          );
        }
        return;
      }
      this.cubeHoverUpdate(ev.clientX, ev.clientY);
    });
    this.renderer.domElement.addEventListener("mousedown", (ev) => {
      downAt = { x: ev.clientX, y: ev.clientY, face: this.hitCube(ev.clientX, ev.clientY) };
    });
    this.renderer.domElement.addEventListener("mouseup", (ev) => {
      if (this.dragActive) {
        const uv = this.screenToSketch(ev.clientX, ev.clientY);
        const handler = this.dragEndHandler;
        this.endVertexDrag();
        if (uv && handler) handler(uv[0], uv[1]);
        return;
      }
      if (!downAt) return;
      const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y);
      if (moved < 6 && downAt.face >= 0) {
        const preset = this.cubePresets[downAt.face] as ViewPreset;
        if (preset) this.setViewPreset(preset);
      }
      downAt = null;
    });
    // Lights: MeshStandardMaterial is black without any — hemisphere for the
    // base tone, a directional for shape-defining shading.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(1, 1.6, 0.8);
    this.scene.add(sun);

    this.renderer.domElement.addEventListener("mousedown", (ev) => {
      if (ev.button !== 0) return;
      if (this.measuring) {
        this.measureClick(ev.clientX, ev.clientY);
        return;
      }
      const rect = this.renderer.domElement.getBoundingClientRect();
      const p = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(p, this.camera);
      // One primitive per mode: the capture zone belongs to the mode's own
      // geometry only, so nothing steals a click from anything else.
      const dist = this.camera.position.distanceTo(this.controls.target);
      if (this.selectMode === "edge") {
        ray.params.Line = { threshold: Math.max(5, dist * 0.04) };
        const edgeHits = ray.intersectObjects(this.edgeLines, false);
        if (edgeHits.length && edgeHits[0].object.userData.edgeId !== undefined) {
          this.edgePickHandler?.(edgeHits[0].object.userData.edgeId as number);
        }
        return;
      }
      if (this.selectMode === "vertex") {
        // 屏幕空间拾取 (最终修复): three 的 Points raycast 曾在手工距离
        // 0.000 处返回 0 命中 (黑盒失灵, drag-loop e2e 实测)——投影距离
        // 14px 窗口取最近顶点, 同一 math as the measure label。
        const hit = this.nearestVertexScreen(ev.clientX, ev.clientY, 14);
        if (hit) {
          // The drag owner decides: a vertex it can address starts a drag
          // (orbit suppressed for the gesture), anything else falls through
          // to the plain pick readout.
          if (this.dragStartHandler && this.dragStartHandler(hit.id)) return;
          this.vertexPickHandler?.(hit.id);
        }
        return;
      }
      if (!this.pickHandler) return;
      const hits = ray.intersectObjects(this.faceMeshes, false);
      if (hits.length && hits[0].object.userData.faceId !== undefined) {
        this.pickHandler(hits[0].object.userData.faceId as number);
      }
    });

    // OrbitControls LAST: same-element pointerdown listeners fire in
    // registration order, so the vertex-drag gate above can disable the
    // controls inside the SAME event before OrbitControls' own handler
    // starts an orbit (measured e2e: grabbing a vertex rotated the camera
    // and the drag never reached the solver).
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    new ResizeObserver(() => this.resize(container)).observe(container);
    this.resize(container);
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      // dimension terminators stay camera-facing
      for (const ring of this.measureRingFaces) ring.lookAt(this.camera.position);
      // the measure chip rides the helper line's midpoint in screen space
      if (this.measureLabel && this.measureAnchor) {
        const v = this.measureAnchor.clone().project(this.camera);
        if (v.z < 1) {
          this.measureLabel.style.display = "block";
          this.measureLabel.style.left = ((v.x + 1) / 2) * w + "px";
          this.measureLabel.style.top = ((-v.y + 1) / 2) * h + "px";
        } else {
          this.measureLabel.style.display = "none";
        }
      }
      this.renderer.setViewport(0, 0, w, h);
      this.renderer.setScissorTest(false);
      this.renderer.render(this.scene, this.camera);
      if (this.gizmoOn) {
        // The gizmo camera rides the main camera's direction: the view cube
        // always reads the CURRENT view orientation (ViewCube-style).
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        this.gizmoCamera.position.copy(dir.multiplyScalar(8));
        this.gizmoCamera.up.copy(this.camera.up);
        this.gizmoCamera.lookAt(0, 0, 0);
        const gs = this.gizmoSize;
        const left = w - gs - 14, top = 40;
        this.cubeRect = { left, top, size: gs };
        this.renderer.clearDepth();
        this.renderer.setViewport(left, h - top - gs, gs, gs);
        this.renderer.setScissor(left, h - top - gs, gs, gs);
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

  onVertexPick(handler: (vertexId: number) => void): void {
    this.vertexPickHandler = handler;
  }

  // getVertex — the deduped topology vertex's world position (pick address
  // → readout; vertices have no server-side semantics, selection is local).
  getVertex(id: number): { id: number; position: [number, number, number] } | null {
    const p = this.activeVertexPositions[id];
    return p ? { id, position: p } : null;
  }

  // ---------------------------------------------------------------------
  // drag loop (docs/drag-loop.md M2)
  // ---------------------------------------------------------------------

  /** vertexScreen — the vertex's viewport pixel (e2e aiming helper; the
   * same projection the measure label uses every frame). */
  vertexScreen(id: number): { x: number; y: number } | null {
    const p = this.vertexPositions[id];
    if (!p) return null;
    const v = new THREE.Vector3(p[0], p[1], p[2]).project(this.camera);
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    return { x: ((v.x + 1) / 2) * w, y: ((-v.y + 1) / 2) * h };
  }

  /** vertexCount — the ACTIVE (filter-aware) vertex cloud size. */
  vertexCount(): number {
    return this.activeVertexPositions.length;
  }

  /** nearestVertexScreen — screen-space vertex pick: the active cloud's
   * vertex closest to the pointer pixel, within maxPx. Replaces the three
   * Points raycast, whose threshold/params behaviour silently dropped hits
   * even at MANUAL distance 0.000 (measured in the drag-loop e2e) — screen
   * projection is the same math the measure label uses, zero black box. */
  nearestVertexScreen(clientX: number, clientY: number, maxPx = 14): { id: number; position: [number, number, number]; screen: { x: number; y: number }; distPx: number } | null {
    let best: { id: number; position: [number, number, number]; screen: { x: number; y: number }; distPx: number } | null = null;
    for (let i = 0; i < this.activeVertexPositions.length; i++) {
      const s = this.vertexScreen(i);
      if (!s) continue;
      const d = Math.hypot(s.x - clientX, s.y - clientY);
      if (d <= maxPx && (!best || d < best.distPx)) {
        best = { id: i, position: this.activeVertexPositions[i], screen: s, distPx: d };
      }
    }
    return best;
  }

  /** debugState — e2e/诊断只读快照（cloud 生命周期排查用）。 */
  debugState(): { cloud: boolean; vpLen: number; filter: number | null; mode: string; measuring: boolean } {
    return {
      cloud: !!this.vertexCloud,
      vpLen: this.vertexPositions.length,
      filter: this.vertexFilterPoints ? this.vertexFilterPoints.length : null,
      mode: this.selectMode,
      measuring: this.measuring,
    };
  }

  /** onVertexDragStart — return true from the handler to own the gesture:
   * the vertex becomes a drag handle (orbit suppressed until release). */
  onVertexDragStart(handler: (vertexId: number) => boolean): void {
    this.dragStartHandler = handler;
  }

  /** beginVertexDrag — lock the sketch frame, show the plane + the grabbed
   * point, suppress orbit, and route pointer moves to onMove (sketch u, v)
   * and the release to onEnd. */
  beginVertexDrag(
    world: [number, number, number],
    frame: { origin: [number, number, number]; ex: number[]; ey: number[]; n: number[] },
    onMove: (u: number, v: number) => void,
    onEnd: (u: number, v: number) => void,
  ): void {
    this.dragPlaneFrame = frame;
    this.dragMoveHandler = onMove;
    this.dragEndHandler = onEnd;
    this.dragActive = true;
    this.controls.enabled = false;
    // the sketch plane, faintly — the drag surface made visible
    if (!this.dragPlaneHelper) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x3a5c8c, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
      this.dragPlaneHelper = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      this.scene.add(this.dragPlaneHelper);
    }
    const size = Math.max(80, this.camera.position.distanceTo(this.controls.target));
    this.dragPlaneHelper.scale.set(size, size, 1);
    this.dragPlaneHelper.position.set(frame.origin[0], frame.origin[1], frame.origin[2]);
    const normal = new THREE.Vector3(frame.n[0], frame.n[1], frame.n[2]);
    this.dragPlaneHelper.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.dragPlaneHelper.visible = true;
    // the grabbed point marker
    if (!this.dragMarker) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffa042 });
      this.dragMarker = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat);
      this.scene.add(this.dragMarker);
    }
    this.dragMarker.scale.setScalar(Math.max(1.2, size * 0.012));
    this.dragMarker.position.set(world[0], world[1], world[2]);
    this.dragMarker.visible = true;
    // keep the marker under the pointer from the very first move
    const first = this.screenToSketch(this.lastPointer.x, this.lastPointer.y);
    if (first) this.dragMoveHandler?.(first[0], first[1]);
  }

  endVertexDrag(): void {
    this.dragActive = false;
    this.controls.enabled = true;
    if (this.dragPlaneHelper) this.dragPlaneHelper.visible = false;
    if (this.dragMarker) this.dragMarker.visible = false;
    this.clearSketchPreview();
    this.dragMoveHandler = null;
    this.dragEndHandler = null;
  }

  /** drawSketchPreview — the solved entities as a bright overlay on the
   * drag plane (M3: the drag stream's per-frame answer, rendered). Entities
   * are sketch (u, v): lines join their ends, circles sample 64 points,
   * arcs sweep their authored ends, splines walk their fit points. */
  drawSketchPreview(
    frame: { origin: [number, number, number]; ex: number[]; ey: number[]; n: number[] },
    entities: Array<Record<string, any>>,
  ): void {
    this.clearSketchPreview();
    const toWorld = (u: number, v: number): THREE.Vector3 =>
      new THREE.Vector3(
        frame.origin[0] + frame.ex[0] * u + frame.ey[0] * v,
        frame.origin[1] + frame.ex[1] * u + frame.ey[1] * v,
        frame.origin[2] + frame.ex[2] * u + frame.ey[2] * v,
      );
    const pts: THREE.Vector3[] = [];
    const push = (u: number, v: number) => pts.push(toWorld(u, v));
    for (const e of entities) {
      if (e.construction) continue;
      if (e.type === "line" && e.start && e.end) {
        push(e.start[0], e.start[1]);
        push(e.end[0], e.end[1]);
      } else if (e.type === "circle" && e.center && typeof e.radius === "number") {
        const N = 64;
        for (let i = 0; i <= N; i++) {
          const a = (2 * Math.PI * i) / N;
          push(e.center[0] + e.radius * Math.cos(a), e.center[1] + e.radius * Math.sin(a));
        }
      } else if (e.type === "arc" && e.center && e.start && e.end) {
        const a0 = Math.atan2(e.start[1] - e.center[1], e.start[0] - e.center[0]);
        const a1 = Math.atan2(e.end[1] - e.center[1], e.end[0] - e.center[0]);
        let sweep = a1 - a0;
        while (sweep <= 0) sweep += 2 * Math.PI;
        const N = 24;
        for (let i = 0; i <= N; i++) {
          const a = a0 + sweep * (i / N);
          push(e.center[0] + (e.radius ?? 0) * Math.cos(a), e.center[1] + (e.radius ?? 0) * Math.sin(a));
        }
      } else if (e.type === "spline" && e.points) {
        for (const p of e.points) push(p[0], p[1]);
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x7ec8ff, transparent: true, opacity: 0.95 });
    this.dragPreview = new THREE.LineSegments(geo, mat);
    this.scene.add(this.dragPreview);
  }

  clearSketchPreview(): void {
    if (this.dragPreview) {
      this.scene.remove(this.dragPreview);
      this.dragPreview.geometry.dispose();
      (this.dragPreview.material as THREE.Material).dispose();
      this.dragPreview = null;
    }
  }

  private lastPointer = { x: 0, y: 0 };

  /** screenToSketch — the pointer ray onto the drag plane, in sketch (u, v).
   * null when the ray runs parallel or no drag is active. */
  screenToSketch(clientX: number, clientY: number): [number, number] | null {
    if (!this.dragPlaneFrame) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(p, this.camera);
    const f = this.dragPlaneFrame;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      new THREE.Vector3(f.n[0], f.n[1], f.n[2]),
      new THREE.Vector3(f.origin[0], f.origin[1], f.origin[2]),
    );
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(plane, hit)) return null;
    const rel = hit.clone().sub(new THREE.Vector3(f.origin[0], f.origin[1], f.origin[2]));
    return [rel.dot(new THREE.Vector3(f.ex[0], f.ex[1], f.ex[2])), rel.dot(new THREE.Vector3(f.ey[0], f.ey[1], f.ey[2]))];
  }

  get selectModeValue(): "vertex" | "edge" | "face" {
    return this.selectMode;
  }

  // setSelectMode — 点/边/面 disjoint picking; also gates the overlay
  // visibility so the aimed primitive is the VISIBLE one.
  setSelectMode(mode: "vertex" | "edge" | "face"): void {
    this.selectMode = mode;
    if (this.vertexCloud) this.vertexCloud.visible = mode === "vertex";
    this.clearVertexMarker();
    for (const k of ["vertex", "edge", "face"] as const) {
      this.selectButtons[k]?.classList.toggle("active", k === mode);
    }
    this.renderer.domElement.style.cursor = "";
    const tips: Record<"vertex" | "edge" | "face", string> = {
      vertex: "顶点模式：点击端点/角点",
      edge: "边模式：点击靠近棱线（有加宽捕获区）",
      face: "面模式：点击表面",
    };
    const tip = this.container.querySelector(".viewer-axis-tip") as HTMLElement | null;
    if (tip) {
      tip.textContent = tips[mode];
      tip.style.display = "block";
      tip.style.left = "8px";
      tip.style.top = "34px";
      if (this.tipHideTimer) clearTimeout(this.tipHideTimer);
      this.tipHideTimer = setTimeout(() => {
        tip.style.display = "none";
      }, 2200) as unknown as number;
    }
  }

  private tipHideTimer: number | null = null;

  // highlightVertex — the marker on the picked vertex (local selection).
  highlightVertex(id: number | null): void {
    this.clearVertexMarker();
    if (id === null) return;
    const p = this.activeVertexPositions[id] ?? this.vertexPositions[id];
    if (!p) return;
    const size = Math.max(this.camera.position.distanceTo(this.controls.target) * 0.012, 1.2);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(size),
      new THREE.MeshBasicMaterial({ color: 0xffd27a }),
    );
    marker.position.set(p[0], p[1], p[2]);
    this.scene.add(marker);
    this.vertexMarker = marker;
  }

  private clearVertexMarker(): void {
    if (this.vertexMarker) {
      this.scene.remove(this.vertexMarker);
      this.vertexMarker.geometry.dispose();
      this.vertexMarker = null;
    }
  }

  // setEdges — the topology's sampled polylines as a pickable overlay, plus
  // the vertex cloud (deduped endpoints) for 顶点 mode.
  setEdges(edges: Array<{ id: number; points: number[][] }> | null): void {
    this.edgeLines.forEach((l) => {
      this.scene.remove(l);
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.edgeLines = [];
    if (this.vertexCloud) {
      this.scene.remove(this.vertexCloud);
      this.vertexCloud.geometry.dispose();
      (this.vertexCloud.material as THREE.Material).dispose();
      this.vertexCloud = null;
    }
    this.vertexPositions = [];
    if (!edges) { this.rebuildVertexCloud(); document.title = "setEdges(NULL)"; return; }
    // dedupe endpoints (rounded to 0.01mm) → stable vertex ids by first sight
    const seen = new Map<string, number>();
    const verts: THREE.Vector3[] = [];
    for (const e of edges) {
      if (!e.points || e.points.length < 2) continue;
      for (const endpoint of [e.points[0], e.points[e.points.length - 1]]) {
        const key = endpoint.map((v) => Math.round(v * 100)).join(",");
        if (!seen.has(key)) {
          seen.set(key, verts.length);
          this.vertexPositions.push([endpoint[0], endpoint[1], endpoint[2]]);
          verts.push(new THREE.Vector3(endpoint[0], endpoint[1], endpoint[2]));
        }
      }
      const geom = new THREE.BufferGeometry().setFromPoints(
        e.points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      );
      // bright enough to AIM at on the dark faces (the near-black base made
      // edges effectively invisible — unselectable because unseeable)
      const mat = new THREE.LineBasicMaterial({ color: 0x9aa8bc });
      const line = new THREE.Line(geom, mat);
      line.userData.edgeId = e.id;
      this.edgeLines.push(line);
      this.scene.add(line);
    }
    this.rebuildVertexCloud();
  }

  // setVertexFilter — restrict the pickable/visible vertex cloud to the
  // given world points (a sketch's entity endpoints while that sketch is
  // the drag context); null restores every topology corner.
  setVertexFilter(points: Array<[number, number, number]> | null): void {
    this.vertexFilterPoints = points && points.length > 0 ? points : null;
    this.rebuildVertexCloud();
  }

  // rebuildVertexCloud — the pickable Points cloud over the ACTIVE vertex
  // set: the sketch filter when armed, else every topology corner.
  private rebuildVertexCloud(): void {
    if (this.vertexCloud) {
      this.scene.remove(this.vertexCloud);
      this.vertexCloud.geometry.dispose();
      (this.vertexCloud.material as THREE.Material).dispose();
      this.vertexCloud = null;
    }
    const source = this.vertexFilterPoints ?? this.vertexPositions;
    this.activeVertexPositions = source.map((p) => [p[0], p[1], p[2]]);
    if (this.activeVertexPositions.length === 0) return;
    const geom = new THREE.BufferGeometry().setFromPoints(
      this.activeVertexPositions.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    );
    const mat = new THREE.PointsMaterial({
      color: 0xd8e2f0, size: 6, sizeAttenuation: false, visible: this.selectMode === "vertex",
    });
    this.vertexCloud = new THREE.Points(geom, mat);
    this.scene.add(this.vertexCloud);
  }

  // highlightEdges — paint the picked edge(s); called with an empty set to
  // clear. Non-selected edges keep their base colour.
  highlightEdges(selectedEdgeIds: Set<number>): void {
    this.edgeLines.forEach((l) => {
      (l.material as THREE.LineBasicMaterial).color.set(
        selectedEdgeIds.has(l.userData.edgeId as number) ? 0xff8830 : 0x9aa8bc,
      );
    });
  }

  setMesh(mesh: MeshData | null, opts?: { noReframe?: boolean }): void {
    // 拖拽回路: a post-drag refresh must NOT yank the camera — the user is
    // mid-conversation with the model (M2's noReframe path).
    this.meshReframe = opts?.noReframe === true;
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
    if (!box.isEmpty() && !this.meshReframe) {
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

  // highlight — two tiers: the CLICKED face is the loud one (orange, the
  // "you are here" colour shared with edge selection), the owning feature's
  // other faces take a quiet attribution tint. One uniform wash over every
  // face of the feature read as "nothing in particular happened" — on a
  // single-feature part all six faces lit identically.
  highlight(selectedFaceIds: Set<number>, pickedFaceId?: number): void {
    this.faceMeshes.forEach((m, i) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (pickedFaceId !== undefined && i === pickedFaceId) mat.color.set(0xffa042);
      else if (selectedFaceIds.has(i)) mat.color.set(0x5e82c4);
      else mat.color.set(0x8fa3bf);
    });
  }

  // ------------------------------------------------------------------
  // Measure: two picked surface points and their world distance — the CAD
  // viewer's verification staple ("is this plate really 120 wide?").
  // ------------------------------------------------------------------

  toggleMeasure(): boolean {
    this.measuring = !this.measuring;
    if (!this.measuring) this.clearMeasure();
    const tip = this.container.querySelector(".viewer-measure-tip") as HTMLElement | null;
    if (tip) {
      tip.style.display = this.measuring ? "block" : "none";
      tip.textContent = "测量：在模型上点两个点";
    }
    this.renderer.domElement.style.cursor = this.measuring ? "crosshair" : "";
    if (this.measureBtn) this.measureBtn.classList.toggle("active", this.measuring);
    return this.measuring;
  }

  get isMeasuring(): boolean {
    return this.measuring;
  }

  private clearMeasure(): void {
    this.measureMarks.forEach((m) => {
      this.scene.remove(m);
      const mesh = m as THREE.Mesh;
      mesh.geometry?.dispose?.();
    });
    this.measureMarks = [];
    this.measureRingFaces = [];
    this.measurePts = [];
    if (this.measureLabel) {
      this.measureLabel.remove();
      this.measureLabel = null;
    }
    this.measureAnchor = null;
    const tip = this.container.querySelector(".viewer-measure-tip") as HTMLElement | null;
    if (tip) tip.style.display = "none";
  }

  // measureMarkAt — the endpoint marker: a small solid dot inside a ring,
  // the classic dimension terminator, sized in pixels (screen-consistent).
  private measureMarkAt(p: THREE.Vector3): THREE.Group {
    const g = new THREE.Group();
    const dist = this.camera.position.distanceTo(this.controls.target);
    const r = Math.max(dist * 0.008, 0.5);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.55),
      new THREE.MeshBasicMaterial({ color: 0xffd24a }),
    );
    dot.position.copy(p);
    g.add(dot);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r * 0.9, r * 1.25, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd24a, side: THREE.DoubleSide }),
    );
    ring.position.copy(p);
    ring.lookAt(this.camera.position);
    this.measureRingFaces.push(ring);
    g.add(ring);
    return g;
  }

  private measureRingFaces: THREE.Mesh[] = [];

  private measureClick(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(p, this.camera);
    const targets: THREE.Mesh[] = this.assemblyObjects.length
      ? []
      : this.faceMeshes;
    const hits = ray.intersectObjects(targets, false);
    if (!hits.length) return;
    this.measurePts.push(hits[0].point.clone());
    const marker = this.measureMarkAt(hits[0].point);
    this.scene.add(marker);
    this.measureMarks.push(marker);
    if (this.measurePts.length === 2) {
      const [a, b] = this.measurePts;
      // the helper line: dashed, the CAD dimension convention
      const geom = new THREE.BufferGeometry().setFromPoints([a, b]);
      const line = new THREE.Line(
        geom,
        new THREE.LineDashedMaterial({ color: 0xffd24a, dashSize: 3, gapSize: 2, depthTest: false }),
      );
      line.computeLineDistances();
      line.renderOrder = 5;
      this.scene.add(line);
      this.measureMarks.push(line);
      // the value chip rides the line's midpoint (projected per frame)
      const label = this.container.querySelector(".viewer-measure-label") as HTMLDivElement | null;
      if (label) {
        this.measureLabel = label;
        this.measureAnchor = a.clone().add(b).multiplyScalar(0.5);
        this.measureLabel.textContent = `${a.distanceTo(b).toFixed(2)} mm`;
      }
      const tip = this.container.querySelector(".viewer-measure-tip") as HTMLElement | null;
      if (tip) tip.textContent = "再点一点重新测量";
      // restart on the next click
      this.measurePts = [];
    }
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

  // buildViewCube — the ViewCube: a labeled cube (前/后/左/右/上/下 canvas
  // textures) with the three colored axis lines running through it. Clicking
  // a face snaps that standard view (the pointer handlers below); dragging
  // over it still orbits via OrbitControls.
  private buildViewCube(): void {
    const mkFace = (label: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d")!;
      g.fillStyle = "#2b3b57";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "rgba(216,221,229,0.35)";
      g.lineWidth = 3;
      g.strokeRect(5, 5, 118, 118);
      g.fillStyle = "#e8edf5";
      g.font = "bold 46px system-ui, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(label, 64, 66);
      return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), depthTest: false });
    };
    // Box material order: +X 右, −X 左, +Y 后, −Y 前, +Z 上, −Z 下.
    const mats = [mkFace("右"), mkFace("左"), mkFace("后"), mkFace("前"), mkFace("上"), mkFace("下")];
    this.viewCube = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 1.35), mats);
    this.gizmoScene.add(this.viewCube);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.36, 1.36, 1.36)),
      new THREE.LineBasicMaterial({ color: 0x9aa4b2, depthTest: false }),
    );
    this.gizmoScene.add(edges);
    const axisLine = (dir: [number, number, number], color: number) => {
      const v = new THREE.Vector3(dir[0], dir[1], dir[2]);
      const geom = new THREE.BufferGeometry().setFromPoints([
        v.clone().multiplyScalar(-1.9), v.clone().multiplyScalar(1.9),
      ]);
      this.gizmoScene.add(new THREE.Line(geom, new THREE.LineBasicMaterial({ color, depthTest: false })));
    };
    axisLine([1, 0, 0], 0xe0554d);
    axisLine([0, 1, 0], 0x51b06a);
    axisLine([0, 0, 1], 0x4f8cff);
  }

  // hitCube — the hovered cube face's materialIndex, or −1: the pointer maps
  // into the gizmo viewport rect (top-right) and raycasts the cube with the
  // gizmo camera. Only when the cube is on.
  private hitCube(clientX: number, clientY: number): number {
    if (!this.gizmoOn || !this.viewCube) return -1;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mx = clientX - rect.left, my = clientY - rect.top;
    const { left, top, size } = this.cubeRect;
    if (mx < left || mx > left + size || my < top || my > top + size) return -1;
    const p = new THREE.Vector2(
      ((mx - left) / size) * 2 - 1,
      -(((my - top) / size) * 2 - 1),
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(p, this.gizmoCamera);
    const hits = ray.intersectObject(this.viewCube, false);
    return hits.length && hits[0].face ? hits[0].face.materialIndex : -1;
  }

  // cubeHoverUpdate — highlight the hovered face + cursor + name tip.
  private cubeHoverUpdate(clientX: number, clientY: number): void {
    const face = this.hitCube(clientX, clientY);
    if (face !== this.cubeHover && this.viewCube) {
      const mats = this.viewCube.material as THREE.MeshBasicMaterial[];
      mats.forEach((m, i) => (m.color.set(i === face ? 0xbfd4ff : 0xffffff)));
      this.cubeHover = face;
      this.renderer.domElement.style.cursor = face >= 0 ? "pointer" : "";
    }
    const tip = this.container.querySelector(".viewer-axis-tip") as HTMLElement | null;
    if (tip) {
      if (face >= 0) {
        tip.textContent = this.cubeFaceNames[face] + "视图";
        tip.style.display = "block";
        tip.style.left = this.cubeRect.left + this.cubeRect.size / 2 - 24 + "px";
        tip.style.top = this.cubeRect.top + this.cubeRect.size + 6 + "px";
      } else {
        tip.style.display = "none";
      }
    }
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
    const iso = document.createElement("button");
    iso.textContent = "轴测";
    iso.title = "等轴测视图";
    iso.onclick = () => this.setViewPreset("iso");
    bar.appendChild(iso);
    const measure = document.createElement("button");
    measure.textContent = "测量";
    measure.title = "点两点测距离";
    measure.onclick = () => this.toggleMeasure();
    this.measureBtn = measure;
    bar.appendChild(measure);
    // selection modes: disjoint picking (the mixed edge/face capture was
    // unusable — faces stole edge clicks). Keys 1/2/3.
    const mkMode = (label: string, mode: "vertex" | "edge" | "face", key: string) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.title = `${label}选中（快捷键 ${key}）`;
      b.onclick = () => this.setSelectMode(mode);
      this.selectButtons[mode] = b;
      bar.appendChild(b);
      return b;
    };
    mkMode("点", "vertex", "1");
    mkMode("边", "edge", "2");
    mkMode("面", "face", "3").classList.add("active");
    window.addEventListener("keydown", (ev) => {
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (ev.key === "1") this.setSelectMode("vertex");
      else if (ev.key === "2") this.setSelectMode("edge");
      else if (ev.key === "3") this.setSelectMode("face");
    });
    const measureTip = document.createElement("div");
    measureTip.className = "viewer-measure-tip";
    const measureLabel = document.createElement("div");
    measureLabel.className = "viewer-measure-label";
    // hover/name tip for the view cube
    const tip = document.createElement("div");
    tip.className = "viewer-axis-tip";
    container.appendChild(bar);
    container.appendChild(tip);
    container.appendChild(measureTip);
    container.appendChild(measureLabel);
  }

  private resize(container: HTMLElement): void {
    const box = container.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    this.renderer.setSize(box.width, box.height);
    this.camera.aspect = box.width / box.height;
    this.camera.updateProjectionMatrix();
  }
}
