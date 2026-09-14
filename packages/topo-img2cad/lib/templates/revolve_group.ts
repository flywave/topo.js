/**
 * Template: Revolved shapes (bottles, vases, shafts, etc.)
 */

/**
 * Generate revolve code from profile points.
 */
export function generateRevolveCode(params: {
  profilePoints: Array<[number, number]>;
  angle?: number;
  axis?: "x" | "y" | "z";
}): string {
  const angle = params.angle ?? 360;
  const pts = params.profilePoints;

  // Build polyline string
  const ptStr = pts.map((p) => `pnt(tp, ${p[0]}, ${p[1]}, 0)`).join(", ");

  return `
function createModel(tp, CQWorkplane, pnt, vec, gpVec, render, console) {
  try {
    // Profile for revolution
    const profile = CQWorkplane.moveTo(${pts[0][0]}, ${pts[0][1]})
${pts.slice(1).map((p) => `      .lineTo(${p[0]}, ${p[1]})`).join("\n")}
      .close();

    // Revolve around Z axis
    const body = profile.revolveSimple(${angle});

    render(body);
  } catch (e) {
    console.error("Error:", e);
  }
}
`;
}
