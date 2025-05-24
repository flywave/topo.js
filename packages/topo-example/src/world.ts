import * as THREE from "three"
import Setup from "./setup"
import initTopo, { gp_Pnt, MultiSegmentPipeParams, CircProfile, PolygonProfile, TopoInstance } from "topo-wasm"
import { setTopo, mesh } from "topo-js"
import { BasePrimitiveType, SphereShapePrimitive, ECPrimitiveType, GSPrimitiveType, GTPrimitiveType, HPPrimitiveType } from "topo-primitives"
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { createShapePrimitive } from "./primitives"

export default class World {
  setup: Setup
  scene: THREE.Scene
  grid: THREE.GridHelper | null = null
  oc: TopoInstance | null = null
  done: Promise<void> | null = null
  gui: GUI | null = null  // 新增GUI实例
  selectedCategory: string = 'base'
  selectedType: string = BasePrimitiveType.Pipe
  group: THREE.Group | null = null  // 新增meshGroup
  private typeController: any = null; // Add reference to type controller

  constructor() {
    this.setup = Setup.getInstance()
    this.scene = this.setup.scene
    this.scene.background = new THREE.Color(0x333333);

    this.grid = new THREE.GridHelper(1000, 100, 0x111111, 0x111111);
    this.scene.add(this.grid);

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

    // 第一级选择：类别
    const categoryOptions = {
      category: this.selectedCategory,
      categories: ['base', 'ec', 'gs', 'gt', 'hp']
    }

    // 第二级选择：具体类型
    const typeOptions = {
      type: this.selectedType,
      types: Object.values(BasePrimitiveType) // 默认显示base类型
    }

    // 添加类型选择器
    this.typeController = this.gui.add(typeOptions, 'type', typeOptions.types)
      .name('Type')
      .onChange((value: string) => {
        this.selectedType = value
        this.updateShapeBasedOnSelection(value as BasePrimitiveType | ECPrimitiveType | GSPrimitiveType | GTPrimitiveType | HPPrimitiveType)
      })

    // 添加类别选择器
    this.gui.add(categoryOptions, 'category', categoryOptions.categories)
      .name('Category')
      .onChange((value: string) => {
        this.selectedCategory = value
        this.updateTypeOptions(value)
      })

    // 初始化类型选项
    this.updateTypeOptions(this.selectedCategory)
  }


  private updateTypeOptions(category: string, controller?: any) {
    let types: string[] = []

    switch (category) {
      case 'base':
        types = Object.values(BasePrimitiveType)
        break
      case 'ec':
        types = Object.values(ECPrimitiveType)
        break
      case 'gs':
        types = Object.values(GSPrimitiveType)
        break
      case 'gt':
        types = Object.values(GTPrimitiveType)
        break
      case 'hp':
        types = Object.values(HPPrimitiveType)
        break
    }

    this.typeController.destroy()

    // 第二级选择：具体类型
    const typeOptions = {
      type: this.selectedType,
      types
    }

    this.typeController = this.gui!.add(typeOptions, 'type', typeOptions.types)
      .name('Type')
      .onChange((value: string) => {
        this.selectedType = value
        this.updateShapeBasedOnSelection(value as BasePrimitiveType | ECPrimitiveType | GSPrimitiveType | GTPrimitiveType | HPPrimitiveType)
      })


    if (this.typeController) {
      this.typeController.options(types)
      this.selectedType = types[0]
      this.typeController.setValue(this.selectedType)
    }
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
    const shape = primitive.build();
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
    const light = new THREE.AmbientLight(0x404040)
    this.scene.add(light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0.5, 0.5, 0.5)
    this.scene.add(directionalLight)
  }

  async TopoInit() {
    this.oc = await initTopo().then((tp) => {
      setTopo(tp);
      return tp
    })
    console.log("open cascade ready!!!")
  }
}
