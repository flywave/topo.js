import { expect, it } from "vitest";
import { getTopo } from "./helpers/topo";

it("probe round tube cut", async () => {
    const tp: any = await getTopo();
    const outer = new tp.Shape(tp.createCylinderShape({ radius: 100, height: 6000, angle: null } as any), false);
    const inner = new tp.Shape(tp.createCylinderShape({ radius: 92, height: 6000, angle: null } as any), false);
    console.log("outer isNull:", outer.isNull(), "valid:", outer.isValid());
    console.log("inner isNull:", inner.isNull(), "valid:", inner.isValid());
    const cut = tp.ShapeOps.cut(outer, inner, 1e-6);
    console.log("cut:", cut === undefined ? "undefined" : "obj", cut === undefined ? "" : `null=${cut.isNull()} valid=${cut.isValid()}`);
    expect(cut).toBeDefined();
});
