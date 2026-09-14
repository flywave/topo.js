/**
 * Template: Assembly group (multi-component models with location transforms)
 */

/**
 * Generate assembly code from component definitions.
 */
export function generateAssemblyCode(components: Array<{
  name: string;
  type: string;
  params: Record<string, number>;
  location?: number[];
  color?: [number, number, number];
}>): string {
  let code = `
function createModel(tp, CQWorkplane, pnt, vec, gpVec, render, console) {
  try {
    const assembly = tp.Assembly.create(new tp.Vertex(0, 0, 0), undefined, "root");
`;

  for (const comp of components) {
    // Generate shape code based on type
    let shapeCode: string;
    switch (comp.type) {
      case "box":
        shapeCode = `CQWorkplane.boxCentered(${comp.params.length ?? 10}, ${comp.params.width ?? 10}, ${comp.params.height ?? 10})`;
        break;
      case "cylinder":
        shapeCode = `CQWorkplane.circleCentered(${comp.params.radius ?? 5}).extrudeSimple(${comp.params.height ?? 10})`;
        break;
      case "sphere":
        shapeCode = `CQWorkplane.sphere(${comp.params.radius ?? 5})`;
        break;
      default:
        shapeCode = `CQWorkplane.boxCentered(10, 10, 10)`;
    }

    // Location
    let locCode = "undefined";
    if (comp.location) {
      locCode = `(() => {
        const trsf = new tp.gp_Trsf_1();
        trsf.SetValues(${comp.location.join(", ")});
        return new tp.Location(trsf);
      })()`;
    }

    // Color
    let colorCode = "undefined";
    if (comp.color) {
      colorCode = `new tp.Quantity_Color_3(${comp.color[0]}, ${comp.color[1]}, ${comp.color[2]}, tp.Quantity_TypeOfColor.Quantity_TOC_RGB)`;
    }

    code += `
    // Component: ${comp.name}
    {
      const shape = ${shapeCode};
      const loc = ${locCode};
      const color = ${colorCode};
      assembly.add(shape, loc, "${comp.name}", color);
    }
`;
  }

  code += `
    render(assembly);
  } catch (e) {
    console.error("Error:", e);
  }
}
`;
  return code;
}
