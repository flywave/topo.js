import * as THREE from "three"
import Setup from "./setup"
import initTopo, { CuboidParams, TopoInstance } from "topo-wasm"
import { setTopo, mesh } from "topo-js"

export default class World {
  setup: Setup
  scene: THREE.Scene
  oc: TopoInstance | null = null
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
  
  createCube(tp: TopoInstance) {
    let params : CuboidParams = {
      length: 10,
      width: 10,
      height: 10,
    }

    const shp =  tp.createCuboid(params)
    const shape = new tp.Shape(shp,false);
    const ff = shape.autoCast();
    const geometries = mesh(shape)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })

    const group = new THREE.Group()
    geometries.forEach((geometry) => {
      group.add(new THREE.Mesh(geometry, material))
    })

    this.scene.add(group)
  }

  addLights() {
    const light = new THREE.AmbientLight(0x404040)
    this.scene.add(light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0.5, 0.5, 0.5)
    this.scene.add(directionalLight)
  }

  async TopoInit() {
    this.oc = await initTopo().then((tp) => {
      setTopo(tp);
      this.createCube(tp);
      return tp
    })
    console.log("open cascade ready!!!")
  }
}
