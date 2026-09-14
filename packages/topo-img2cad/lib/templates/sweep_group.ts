/**
 * Template: Swept shapes (pipes, rails, extruded profiles along paths)
 */

/**
 * Generate sweep code from path and profile.
 */
export function generateSweepCode(params: {
  profileType: "circle" | "rect" | "polygon";
  profileParams: Record<string, number>;
  pathPoints: Array<[number, number, number]>;
}): string {
  const pts = params.pathPoints;

  // Generate profile
  let profileCode: string;
  switch (params.profileType) {
    case "circle":
      profileCode = `CQWorkplane.circleCentered(${params.profileParams.radius ?? 5})`;
      break;
    case "rect":
      profileCode = `CQWorkplane.rectCentered(${params.profileParams.width ?? 10}, ${params.profileParams.height ?? 10})`;
      break;
    case "polygon":
      profileCode = `CQWorkplane.polygonSimple(${params.profileParams.sides ?? 6}, ${params.profileParams.radius ?? 5})`;
      break;
    default:
      profileCode = `CQWorkplane.circleCentered(5)`;
  }

  // Generate path wire
  let pathCode: string;
  if (pts.length === 2) {
    pathCode = `CQWorkplane.moveTo(${pts[0][0]}, ${pts[0][1]}, ${pts[0][2]})
      .lineTo(${pts[1][0]}, ${pts[1][1]}, ${pts[1][2]})`;
  } else {
    pathCode = `CQWorkplane.moveTo(${pts[0][0]}, ${pts[0][1]}, ${pts[0][2]})
${pts.slice(1).map((p) => `      .lineTo(${p[0]}, ${p[1]}, ${p[2]})`).join("\n")}`;
  }

  return `
function createModel(tp, CQWorkplane, pnt, vec, gpVec, render, console) {
  try {
    // Profile
    const profile = ${profileCode};

    // Path
    const path = ${pathCode};

    // Sweep profile along path
    const body = profile.sweep(path);

    render(body);
  } catch (e) {
    console.error("Error:", e);
  }
}
`;
}
