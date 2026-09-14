/**
 * Template: Box-based shapes
 *
 * Generates CQWorkplane code for box组合 shapes.
 */

export const BOX_TEMPLATE = `
// Box group template
function createModel(tp, CQWorkplane, pnt, vec, gpVec, render, console) {
  try {
    // Base box
    const base = CQWorkplane.boxCentered({length}, {width}, {height});

    // Boolean cuts
    {cuts}

    render(base);
  } catch (e) {
    console.error("Error creating box model:", e);
  }
}
`;

export const BOX_CUT_TEMPLATE = `
    // Cut hole: {holeName}
    const {holeName} = CQWorkplane.circleCentered({holeRadius}).extrudeSimple({holeDepth});
    base = base.cut({holeName});
`;

/**
 * Generate box-group code from params.
 */
export function generateBoxCode(params: {
  length: number;
  width: number;
  height: number;
  holes?: Array<{ x: number; y: number; radius: number; depth: number }>;
}): string {
  let code = `
function createModel(tp, CQWorkplane, pnt, vec, gpVec, render, console) {
  try {
    // Base box
    let base = CQWorkplane.boxCentered(${params.length}, ${params.width}, ${params.height});
`;

  if (params.holes) {
    for (let i = 0; i < params.holes.length; i++) {
      const h = params.holes[i];
      code += `
    // Hole ${i + 1}
    const hole${i} = CQWorkplane.circleCentered(${h.radius}).extrudeSimple(${h.depth});
    base = base.cut(hole${i});
`;
    }
  }

  code += `
    render(base);
  } catch (e) {
    console.error("Error:", e);
  }
}
`;
  return code;
}
