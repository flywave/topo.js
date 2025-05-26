import * as THREE from "three"
import Setup from "./setup"
import initTopo, { gp_Pnt, MultiSegmentPipeParams, CircProfile, PolygonProfile, TopoInstance } from "topo-wasm"
import { mesh, requestTopoInstance } from "topo-js"
import { BasePrimitiveType, SphereShapePrimitive, ECPrimitiveType, GSPrimitiveType, GTPrimitiveType, HPPrimitiveType } from "topo-primitives"
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { createShapePrimitive } from "./primitives"
import createAxisHelper from "./axes"

export default class World {
  setup: Setup
  scene: THREE.Scene
  grid: THREE.GridHelper | null = null
  oc: TopoInstance | null = null
  done: Promise<void> | null = null
  gui: GUI | null = null  // 新增GUI实例
  selectedShape: BasePrimitiveType | ECPrimitiveType | GSPrimitiveType | GTPrimitiveType | HPPrimitiveType = BasePrimitiveType.Pipe
  group: THREE.Group | null = null  // 新增meshGroup
  axis: THREE.Group | null = null  // 新增meshGroup

  constructor() {
    this.setup = Setup.getInstance()
    this.scene = this.setup.scene
    this.scene.background = new THREE.Color(0x333333);

    this.grid = new THREE.GridHelper(1000, 100, 0x111111, 0x111111);
    this.grid.rotation.x = Math.PI / 2; // 旋转90度使其位于XY平面
    this.scene.add(this.grid);

    this.axis = createAxisHelper(200)
    this.scene.add(this.axis)

    this.addLights()
    this.done = this.TopoInit()

    this.initUI()  // 初始化UI
  }

  waitDone() {
    return this.done
  }

  initUI() {
    if (this.gui) {
      this.gui.destroy(); // Clean up existing GUI
    }
    this.gui = new GUI({ width: 300 })

    // 合并所有图元类型选项
    const allShapeTypes = [
      ...Object.values(BasePrimitiveType),
      ...Object.values(ECPrimitiveType),
      ...Object.values(GSPrimitiveType),
      ...Object.values(GTPrimitiveType),
      ...Object.values(HPPrimitiveType)
    ];

    const options = {
      shapeType: this.selectedShape,
      shapes: allShapeTypes
    }

    this.gui.add(options, 'shapeType', options.shapes)
      .name('Shape Type')
      .onChange((value: BasePrimitiveType | ECPrimitiveType | GSPrimitiveType | GTPrimitiveType | HPPrimitiveType) => {
        this.selectedShape = value;
        console.log('Selected shape:', value);
        // 这里可以添加形状切换逻辑
        this.updateShapeBasedOnSelection(value);
      });
  }

  // 新增方法 - 根据选择的类型更新形状
  private updateShapeBasedOnSelection(shapeType: BasePrimitiveType | ECPrimitiveType | GSPrimitiveType | GTPrimitiveType | HPPrimitiveType) {
    // 清除当前场景中的形状

    this.group?.clear();

    if (!this.oc) return;

    // 创建选中的图元
    const creator = createShapePrimitive(this.oc, shapeType);
    const primitive = creator(); // 只有第一次或类型变化时会实际创建
    if (!primitive) return;

    // 构建形状并添加到场景
    const shape = primitive.setDefault().build();
    if (shape) {
      const geometries = mesh(shape);
      const material = new THREE.MeshStandardMaterial({
        color: this.getColorForShapeType(shapeType),
        metalness: 0.5,
        roughness: 0.7
      });

      this.group = new THREE.Group();
      geometries.forEach(geometry => {
        this.group!.add(new THREE.Mesh(geometry, material));
      });
      this.scene.add(this.group);

      const bbox = new THREE.Box3().setFromObject(this.group);
      const maxX = bbox.max.x;
      const maxY = bbox.max.y;
      const maxZ = bbox.max.z;

      const maxDimension = Math.max(maxX, maxY, maxZ);

      if (this.axis) {
        this.scene.remove(this.axis);
      }


      this.axis = createAxisHelper(maxDimension * 1.2);
      this.scene.add(this.axis)
    }
  }


  private getColorForShapeType(shapeType: string): number {
    // 根据不同类型返回不同颜色
    if (shapeType.includes('GIM/GT')) {
      return 0x4b0082; // 靛蓝色 - 其他GT类型
    }
    if (shapeType.includes('GIM/EC')) {
      return 0x32cd32; // 黄绿色 - 电缆类
    }
    if (shapeType.includes('GIM/GS')) {
      return 0xff4500; // 橙色 - 管道类
    }
    return 0x3498db; // 默认蓝色
  }


  dispose() {
    this.gui?.destroy()  // 清理UI
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // 白色光，强度为0.6
    this.scene.add(ambientLight)

    // 添加半球光
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5) // 天空色为白色，地面色为灰色，强度为0.6
    hemisphereLight.position.set(0, 1, 0)
    this.scene.add(hemisphereLight)

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8) // 白色光，强度为0.8
    directionalLight.position.set(105, 105, 105) // 光源位置
    directionalLight.castShadow = true // 启用阴影
    this.scene.add(directionalLight)
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.bias = -0.0001 // 解决阴影条纹问题
  }

  async TopoInit() {
    this.oc = await requestTopoInstance()
  }
}
