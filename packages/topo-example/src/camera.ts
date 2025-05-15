import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import Setup from "./setup"
import Sizes from "./utils/sizes"

export default class Camera {
  setup: Setup
  camera: THREE.PerspectiveCamera
  sizes: Sizes
  scene: THREE.Scene
  canvas: HTMLCanvasElement
  controls: OrbitControls | null

  constructor() {
    this.setup = Setup.getInstance()
    this.sizes = this.setup.sizes
    this.scene = this.setup.scene
    this.canvas = this.setup.canvas

    this.camera = new THREE.PerspectiveCamera(50, this.sizes.aspect, 0.1, 1000)

    this.camera.position.set(0, 50, 100)
    this.scene.add(this.camera)

    this.controls = null
  }

  createControls() {
    if (this.controls) return
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
  }

  disposeControls() {
    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }
  }

  resize() {
    this.camera.aspect = this.sizes.aspect
    this.camera.updateProjectionMatrix()
  }
}
