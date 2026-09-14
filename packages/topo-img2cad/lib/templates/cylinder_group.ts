/**
 * Template: Cylinder-based shapes (cylinders, cones, turned parts)
 */

/**
 * Generate cylinder-group code from params.
 */
export function generateCylinderCode(params: {
  radius: number;
  height: number;
  radiusTop?: number;
  holes?: Array<{ radius: number; depth: number }>;
}): string {
  const rTop = params.radiusTop ?? params.radius;

  let code = `
function createModel(tp, CQWorkplane, pnt, vec, gpVec, render, console) {
  try {
`;

  if (rTop === params.radius) {
    // Simple cylinder
    code += `    let body = CQWorkplane.circleCentered(${params.radius}).extrudeSimple(${params.height});\n`;
  } else {
    // Cone / frustum — use profile points + revolve
    code += `    // Cone/frustum via revolve
    const profile = CQWorkplane.moveTo(${rTop}, 0)
      .lineTo(${params.radius}, ${params.height})
      .lineTo(0, ${params.height})
      .close();
    let body = profile.revolveSimple(360);
`;
  }

  if (params.holes) {
    for (let i = 0; i < params.holes.length; i++) {
      const h = params.holes[i];
      code += `
    const hole${i} = CQWorkplane.circleCentered(${h.radius}).extrudeSimple(${h.depth});
    body = body.cut(hole${i});
`;
    }
  }

  code += `
    render(body);
  } catch (e) {
    console.error("Error:", e);
  }
}
`;
  return code;
}
