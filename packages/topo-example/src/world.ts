import * as THREE from "three"
import Setup from "./setup"
import initTopo, { VentilationPavilionParams, TopoInstance } from "topo-wasm"
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

    let params: VentilationPavilionParams = {
        topLength: 400.0,    // 顶长200mm
        middleLength: 300.0, // 中部长度300mm
        bottomLength: 400.0, // 底长400mm
        topWidth: 350.0,     // 顶宽150mm
        middleWidth: 250.0,  // 中部宽度250mm
        bottomWidth: 350.0,  // 底宽350mm
        topHeight: 50.0,     // 顶高50mm
        height: 150.0,       // 总高300mm
        baseHeight: 30.0     // 基础高100mm
    }

    const shp =  tp.createVentilationPavilion(params as VentilationPavilionParams)
    const shape = new tp.Shape(shp,false);
    const ff = shape.autoCast();
    const geometries = mesh(shape)
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })

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
