import { expect, it } from "vitest";
import { getTopo } from "./helpers/topo";
import { SpecSteelPrimitive as SpecSteelPrimitiveClass } from "../lib/gim/gs/spec_steel";

it("probe build round tube", async () => {
    const tp: any = await getTopo();
    const prim = new SpecSteelPrimitiveClass(tp, "RoundSteelTube");
    prim.setParams({ model: "D200X8", length: 6000 });
    console.log("valid:", prim.valid());
    try {
        const shp = prim.build();
        console.log("built:", shp === undefined ? "undefined" : "obj", shp?.isNull?.() ?? "");
    } catch (e: any) {
        console.log("THROWN type:", typeof e, "value:", String(e).slice(0, 80));
    }
    expect(true).toBe(true);
});
