import { GizmoOptions, ViewportGizmo } from "three-viewport-gizmo";
import { OrbitControls } from "three/examples/jsm/Addons.js"
import Setup from "./setup"
import Camera from "./camera"
import Renderer from "./renderer"
import { WebGLRenderer } from "three";

export default class Guizmo {
    setup: Setup
    gizmo: ViewportGizmo | null
    camera: Camera
    renderer: WebGLRenderer
    controls: OrbitControls

    constructor() {
        this.setup = Setup.getInstance()
        this.camera = this.setup.camera
        this.renderer = this.setup.renderer.renderer
        this.controls = this.camera.controls!

        this.gizmo = null
    }

    createGizmo() {
        this.gizmo = new ViewportGizmo(this.camera.camera, this.renderer, this.getGizmoConfig());
        this.gizmo.target = this.controls.target;
        this.gizmo.attachControls(this.controls);

        this.setup.scene.add(this.gizmo);
    }

    getGizmoConfig() {
        const darkColors = {
            color: 0x333333,
            labelColor: 0xdddddd,
            hover: {
                color: 0x4bac84,
                labelColor: 0xffffff,
            },
        };

        const darkBackground = {
            color: 0x444444,
            hover: { color: 0x444444 },
        };

        const darkCubeConfig: GizmoOptions = {
            type: "sphere",
            size: 128,
            background: darkBackground,
            corners: darkColors,
            edges: darkColors,
            right: darkColors,
            top: darkColors,
            front: darkColors,
        };

        return darkCubeConfig;
    }

    update() {
        this.gizmo?.render()
    }

    resize() {
        this.gizmo?.update();
    }
}