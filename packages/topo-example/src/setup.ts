import * as THREE from "three"
import Sizes from "./utils/sizes"
import Time from "./utils/time"
import Camera from "./camera"
import Renderer from "./renderer"
import World from "./world"
import Guizmo from "./guizmo"

export default class Setup {
  private static instance: Setup
  sizes: Sizes
  time: Time
  canvas: HTMLCanvasElement
  scene: THREE.Scene
  camera: Camera
  renderer: Renderer
  world: World
  guizmo: Guizmo

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.sizes = new Sizes(this.canvas)
    Setup.instance = this
    this.time = new Time()
    this.scene = new THREE.Scene()
    this.camera = new Camera()
    this.renderer = new Renderer()
    this.world = new World()

    this.sizes.on("resize", () => {
      this.resize()
    })

    this.time.on("tick", () => {
      this.update()
    })

    this.camera.createControls()
    this.guizmo = new Guizmo()
    this.guizmo.createGizmo()

    this.world.waitDone()?.then(() => {

    })
  }

  static getInstance() {
    return Setup.instance
  }

  resize() {
    this.camera.resize()
    this.renderer.resize()
    this.guizmo.resize()
  }

  update() {
    this.guizmo.update()
    this.renderer.update()
  }
}
