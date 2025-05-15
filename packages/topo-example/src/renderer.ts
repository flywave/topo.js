import * as THREE from "three"
import Setup from "./setup"
import Camera from "./camera"
import Sizes from "./utils/sizes"

export default class Renderer {
  setup: Setup
  camera: Camera
  canvas: HTMLCanvasElement
  sizes: Sizes
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer

  constructor() {
    this.setup = Setup.getInstance()
    this.sizes = this.setup.sizes
    this.camera = this.setup.camera
    this.canvas = this.setup.canvas
    this.scene = this.setup.scene

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(this.sizes.pixelRatio)
    this.renderer.setClearColor("#24273A")
  }

  resize() {
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(this.sizes.pixelRatio)
  }

  update() {
    this.renderer.render(this.scene, this.camera.camera)
  }
}
