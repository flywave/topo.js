import { AxesHelper, Group, Mesh, MeshBasicMaterial, Scene } from "three";
import { FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";

const createAxisHelper = (length: number) => {
    const group = new Group();
    const axisHelper = new AxesHelper(length);
    group.add(axisHelper);

    const fontLoader = new FontLoader();
    const fontSize = Math.max(0.1, length * 0.1);

    fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", function (font) {
        const fontConfig = {
            font: font,
            size: fontSize, // 使用计算后的字体大小
            depth: 0.1,
        };
        const xAxisGeometry = new TextGeometry("X", fontConfig);
        const xAxisLabel = new Mesh(xAxisGeometry, new MeshBasicMaterial({ color: "red" }));
        xAxisLabel.position.set(length, 0, 0);
        group.add(xAxisLabel);

        const yAxisGeometry = new TextGeometry("Y", fontConfig);
        const yAxisLabel = new Mesh(yAxisGeometry, new MeshBasicMaterial({ color: "yellow" }));
        yAxisLabel.position.set(0, length, 0);
        group.add(yAxisLabel);

        const zAxisGeometry = new TextGeometry("Z", fontConfig);
        const zAxisLabel = new Mesh(zAxisGeometry, new MeshBasicMaterial({ color: "blue" }));
        zAxisLabel.position.set(0, 0, length);
        group.add(zAxisLabel);
    });

    return group;
};

export default createAxisHelper;