import * as THREE from "three"
import Sizes from "./Utils/Sizes"
import Time from "./Utils/Time"
import Camera from "./Camera"
import Renderer from "./Renderer"
import World from "./World"

export default class Setup {
  private static instance: Setup
  sizes: Sizes
  time: Time
  canvas: HTMLCanvasElement
  scene: THREE.Scene
  camera: Camera
  renderer: Renderer
  world: World

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

    this.world.createCube()
  }

  static getInstance() {
    return Setup.instance
  }

  resize() {
    this.camera.resize()
    this.renderer.resize()
  }

  update() {
    this.renderer.update()
  }
}
