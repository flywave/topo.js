import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export class Viewport {
  readonly canvas: HTMLCanvasElement;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  private modelGroup: THREE.Group;
  private wireframeGroup: THREE.Group;
  private _wireframeEnabled = false;

  /** Whether the user has manually interacted with the camera since last fit. */
  private userInteracted = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e2e);

    // Camera
    const rect = canvas.getBoundingClientRect();
    const aspect = rect.width / rect.height || 1;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 50000);
    this.camera.position.set(0, -200, 500);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    // Track user interaction
    this.controls.addEventListener("start", () => {
      this.userInteracted = true;
    });

    // Groups
    this.modelGroup = new THREE.Group();
    this.modelGroup.name = "models";
    this.scene.add(this.modelGroup);

    this.wireframeGroup = new THREE.Group();
    this.wireframeGroup.name = "wireframes";
    this.wireframeGroup.visible = false;
    this.scene.add(this.wireframeGroup);

    // Lights
    this.addLights();

    // Grid + axes
    this.addGrid();
    this.scene.add(new THREE.AxesHelper(100));

    // Resize observer
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas.parentElement ?? canvas);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  // ---- Lights ---------------------------------------------------------------

  private addLights(): void {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Main directional
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(10, -15, 20);
    this.scene.add(dir);

    // Fill (opposite side, dimmer)
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-10, 15, -10);
    this.scene.add(fill);
  }

  // ---- Grid ----------------------------------------------------------------

  private addGrid(): void {
    const grid = new THREE.GridHelper(1000, 100, 0x45475a, 0x313244);
    grid.rotation.x = Math.PI / 2; // XY plane
    this.scene.add(grid);
  }

  // ---- Public API ----------------------------------------------------------

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  /** Reset camera to default position and fit target. */
  resetCamera(): void {
    this.userInteracted = false;
    this.camera.position.set(0, -200, 500);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  /**
   * Replace model group contents with new geometries.
   * @param solidGeos  Buffered geometries for solid faces.
   * @param edgeGeos   Buffered geometries for wireframe edges.
   */
  setModels(
    solidGeos: THREE.BufferGeometry[],
    edgeGeos: THREE.BufferGeometry[],
  ): void {
    // Dispose old
    this.modelGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    this.wireframeGroup.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    this.modelGroup.clear();
    this.wireframeGroup.clear();

    const solidMat = new THREE.MeshStandardMaterial({
      color: 0x89b4fa,
      side: THREE.DoubleSide,
      flatShading: false,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xf9e2af });

    for (const geo of solidGeos) {
      const mesh = new THREE.Mesh(geo, solidMat);
      this.modelGroup.add(mesh);
    }
    for (const geo of edgeGeos) {
      const lines = new THREE.LineSegments(geo, edgeMat);
      this.wireframeGroup.add(lines);
    }

    // Auto-fit camera
    this.fitCamera();
  }

  /** Fit camera to scene bounding box (only when user hasn't interacted, or new model is larger). */
  private fitCamera(): void {
    const box = new THREE.Box3().setFromObject(this.modelGroup);
    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (this.camera.fov * Math.PI) / 180;
    let distance = maxDim / (2 * Math.tan(fov / 2));
    distance *= 1.5; // padding

    if (!this.userInteracted) {
      // Place camera looking from -Y
      this.camera.position.set(center.x, center.y - distance, center.z + distance * 0.5);
      this.controls.target.copy(center);
      this.camera.lookAt(center);
    } else {
      // User interacted: only expand if new model is significantly larger
      const currentDist = this.camera.position.distanceTo(this.controls.target);
      if (distance > currentDist * 2) {
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        this.camera.position.copy(center).add(dir.multiplyScalar(distance));
        this.controls.target.copy(center);
      }
    }

    this.camera.near = Math.max(0.01, maxDim * 0.001);
    this.camera.far = maxDim * 100;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  /** Toggle wireframe edge display. */
  set wireframe(on: boolean) {
    this._wireframeEnabled = on;
    this.wireframeGroup.visible = on;
  }

  get wireframe(): boolean {
    return this._wireframeEnabled;
  }
}
