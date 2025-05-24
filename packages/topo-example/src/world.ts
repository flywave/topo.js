import * as THREE from "three"
import Setup from "./setup"
import initTopo, { gp_Pnt, MultiSegmentPipeParams, CircProfile, PolygonProfile, TopoInstance } from "topo-wasm"
import { setTopo, mesh } from "topo-js"
import { CableTrayPrimitive } from "topo-primitives"

export default class World {
  setup: Setup
  scene: THREE.Scene
  grid: THREE.GridHelper | null = null
  oc: TopoInstance | null = null
  done: Promise<void> | null = null

  constructor() {
    this.setup = Setup.getInstance()
    this.scene = this.setup.scene
    this.scene.background = new THREE.Color(0x333333);

    this.grid = new THREE.GridHelper(1000, 100, 0x111111, 0x111111);
    this.scene.add(this.grid);

    this.addLights()
    this.done = this.TopoInit()
  }

  waitDone() {
    return this.done
  }

  createPrimitives(tp: TopoInstance) {
    const pathPoints: gp_Pnt[][] = [
      [
        new tp.gp_Pnt_3(0, 0, 0),
        new tp.gp_Pnt_3(13.363751136232167, -26.227833716198802, 40.422308564186096)
      ],
      [
        new tp.gp_Pnt_3(13.363751136232167, -26.227833716198802, 40.422308564186096),
        new tp.gp_Pnt_3(46.29231750732288, -90.69991450663656, 108.94551491551101)
      ],
      [
        new tp.gp_Pnt_3(46.29231750732288, -90.69991450663656, 108.94551491551101),
        new tp.gp_Pnt_3(132.02422594139352, -257.1274096108973, -1.525045077316463)
      ],
      [
        new tp.gp_Pnt_3(132.02422594139352, -257.1274096108973, -1.525045077316463),
        new tp.gp_Pnt_3(155.7862730268389, -461.9796159574762, 275.57995436759666)
      ],
      [
        new tp.gp_Pnt_3(155.7862730268389, -461.9796159574762, 275.57995436759666),
        new tp.gp_Pnt_3(277.5595232350752, -1029.277987377718, 560.3984563779086)
      ]
    ];
    
    const polygonPoints: gp_Pnt[] = [
      new tp.gp_Pnt_3(-3.171, 2.538, 0),
      new tp.gp_Pnt_3(-3.136, 3.954, 0),
      new tp.gp_Pnt_3(-2.498, 5.219, 0),
      new tp.gp_Pnt_3(-1.382, 6.09, 0),
      new tp.gp_Pnt_3(0, 6.4, 0),
      new tp.gp_Pnt_3(1.382, 6.09, 0),
      new tp.gp_Pnt_3(2.498, 5.219, 0),
      new tp.gp_Pnt_3(3.136, 3.954, 0),
      new tp.gp_Pnt_3(3.171, 2.538, 0),
      new tp.gp_Pnt_3(2.5, 0, 0),
      new tp.gp_Pnt_3(-2.5, 0, 0),
      new tp.gp_Pnt_3(-3.171, 2.538, 0)
    ];

    let vec = new tp.gp_Vec_4(-2365550.686973459, 4588616.347934356, 3734082.7681595744).Normalized()

    // 创建多边形剖面
    const polygonProfile: PolygonProfile = {
      type: tp.ProfileType.POLYGON,
      edges: polygonPoints,
      inners: [] // 无内轮廓
    };

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
      wires: pathPoints,
      profiles: [polygonProfile, polygonProfile, polygonProfile, polygonProfile, polygonProfile],
      innerProfiles: null,
      segmentTypes: [
        tp.SegmentType.LINE as any,
        tp.SegmentType.LINE as any,
        tp.SegmentType.LINE as any,
        tp.SegmentType.LINE as any,
        tp.SegmentType.LINE as any
      ],
      transitionMode: tp.TransitionMode.ROUND as any,
      upDir: new tp.gp_Dir_2(vec),
    };

    const primitive = new CableTrayPrimitive(tp)

    //const shp = tp.createMultiSegmentPipe(params as MultiSegmentPipeParams)
    const shp = primitive.setDefault().build();
    if (shp === undefined) {
      console.error("Failed to create shape");
      return;
    }
    const geometries = mesh(shp)
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
