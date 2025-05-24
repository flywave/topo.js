import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import Setup from "./setup"
import Sizes from "./utils/sizes"
import { ViewportGizmo } from "three-viewport-gizmo";

export default class Camera {
  setup: Setup
  camera: THREE.PerspectiveCamera
  sizes: Sizes
  scene: THREE.Scene
  canvas: HTMLCanvasElement
  controls: OrbitControls | null
  gizmo: ViewportGizmo | null

  constructor() {
    this.setup = Setup.getInstance()
    this.sizes = this.setup.sizes
    this.scene = this.setup.scene
    this.canvas = this.setup.canvas

    this.camera = new THREE.PerspectiveCamera(50, this.sizes.aspect, 0.1, 1000)

    this.camera.position.set(0, 50, 100)
    this.scene.add(this.camera)

    this.controls = null
    this.gizmo = null
  }

  createControls() {
    if (this.controls) return
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true

    this.gizmo = new ViewportGizmo(this.camera, this.setup.renderer.renderer, this.getGizmoConfig());

    this.gizmo.target.set(0, 3, 0);
    this.camera.lookAt(this.gizmo.target);
    
    this.gizmo.attachControls(this.controls);
  }

  getGizmoConfig() {
    // Gizmo URL type `?type=sphere|cube`
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type") || "sphere";

    if (type === "sphere") return {};

    const darkColors = {
      color: 0x333333,
      labelColor: 0xdddddd,
      hover: {
        color: 0x4bac84,
        labelColor: 0xffffff,
      },
    };

    const darkBackground = {
      color: 0x444444,
      hover: { color: 0x444444 },
    };

    const darkCubeConfig = {
      type : "cube",
      background: darkBackground,
      corners: darkColors,
      edges: darkColors,
      right: darkColors,
      top: darkColors,
      front: darkColors,
    };

    return darkCubeConfig;
  }

  disposeControls() {
    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }
  }

  update() {
    this.gizmo?.render()
  }

  resize() {
    this.camera.aspect = this.sizes.aspect
    this.camera.updateProjectionMatrix()
    this.gizmo?.update();
  }
}
