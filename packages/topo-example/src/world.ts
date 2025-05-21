import * as THREE from "three"
import Setup from "./setup"
import initTopo, { gp_Pnt, MultiSegmentPipeParams, CircProfile, TopoInstance } from "topo-wasm"
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

  createPrimitives(tp: TopoInstance) {

    // 准备测试数据 - 直线段
    const linePoints: gp_Pnt[] = [
      new tp.gp_Pnt_3(50, -50, 0),
      new tp.gp_Pnt_3(100, 0, 0)
    ];

    // 准备测试数据 - 三点圆弧
    const arcPoints: gp_Pnt[] = [
      new tp.gp_Pnt_3(100, 0, 0),
      new tp.gp_Pnt_3(150, 50, 0),
      new tp.gp_Pnt_3(200, 0, 0)
    ];

    // 准备测试数据 - 圆心弧线
    const centerArcPoints: gp_Pnt[] = [
      new tp.gp_Pnt_3(200, 0, 0),
      new tp.gp_Pnt_3(250, 0, 0), // 圆心
      new tp.gp_Pnt_3(300, 0, 0)
    ];

    // 准备测试数据 - 样条曲线
    const splinePoints: gp_Pnt[] = [
      new tp.gp_Pnt_3(300, 0, 0),
      new tp.gp_Pnt_3(350, 50, 50),
      new tp.gp_Pnt_3(400, 0, 100)
    ];

    // 创建圆形剖面
    const profile: CircProfile = {
      type: tp.ProfileType.CIRC,
      center: new tp.gp_Pnt_3(0, 0, 0),
      norm: new tp.gp_Dir_4(0, 0, 1),
      radius: 10.0
    };

    // 创建内孔剖面
    const innerProfile: CircProfile = {
      type: tp.ProfileType.CIRC,
      center: new tp.gp_Pnt_3(0, 0, 0),
      norm: new tp.gp_Dir_4(0, 0, 1),
      radius: 8.0
    };

    // 设置多段管道参数
    const params: MultiSegmentPipeParams = {
      wires: [linePoints, arcPoints, centerArcPoints, splinePoints],
      profiles: [profile, profile, profile, profile],
      innerProfiles: [innerProfile, innerProfile, innerProfile, innerProfile],
      segmentTypes: [
        tp.SegmentType.LINE as any,
        tp.SegmentType.THREE_POINT_ARC as any,
        tp.SegmentType.CIRCLE_CENTER_ARC as any,
        tp.SegmentType.SPLINE as any
      ],
      transitionMode: tp.TransitionMode.ROUND as any,
      upDir: new tp.gp_Dir_4(0, 0, 1),
    };

    const shp = tp.createMultiSegmentPipe(params as MultiSegmentPipeParams)
    const shape = new tp.Shape(shp, false);
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
      this.createPrimitives(tp);
      return tp
    })
    console.log("open cascade ready!!!")
  }
}
