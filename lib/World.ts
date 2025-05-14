import * as THREE from "three"
import Setup from "./Setup"
import initTopo, { TopoInstance } from "../dist"

export default class World {
  setup: Setup
  scene: THREE.Scene
  OCInstance: TopoInstance | null = null

  constructor() {
    this.setup = Setup.getInstance()
    this.scene = this.setup.scene
    this.addLights()
    this.OCInit()
  }

  createCube() {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(50, 50, 50),
      new THREE.MeshBasicMaterial({
        color: "#ffff00",
      })
    )
    cube.name = "three-mesh"
    this.scene.add(cube)
  }

  addLights() {
    const light = new THREE.AmbientLight(0x404040)
    this.scene.add(light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0.5, 0.5, 0.5)
    this.scene.add(directionalLight)
  }

  async OCInit() {
    this.OCInstance = await initTopo().then((OC) => {
      return OC
    })
    console.log("open cascade ready!!!")
  }
}
