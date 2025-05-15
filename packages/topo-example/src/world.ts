import * as THREE from "three"
import Setup from "./setup"
import initTopo, { TopoInstance } from "topo-wasm-binging"
import { setTopo } from "topo-js"

export default class World {
  setup: Setup
  scene: THREE.Scene
  TopoInstance: TopoInstance | null = null
  done: Promise<void> | null = null

  constructor() {
    this.setup = Setup.getInstance()
    this.scene = this.setup.scene
    this.addLights()
    this.done = this.TopoInit()
  }

  waitDone() {
    return this.done
  }

  addLights() {
    const light = new THREE.AmbientLight(0x404040)
    this.scene.add(light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0.5, 0.5, 0.5)
    this.scene.add(directionalLight)
  }

  async TopoInit() {
    this.TopoInstance = await initTopo().then((tp) => {
      setTopo(tp);
      return tp
    })
    console.log("open cascade ready!!!")
  }
}
