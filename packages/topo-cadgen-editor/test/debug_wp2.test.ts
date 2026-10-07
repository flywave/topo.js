import { it } from "vitest";
import { loadKernel } from "../src/engine/kernel.js";

it("probe workplane prototype", async () => {
  const tp = await loadKernel();
  const wp = new tp.Workplane("XY", undefined, undefined);
  const proto = Object.getPrototypeOf(wp);
  const names = Object.getOwnPropertyNames(proto);
  console.log("WP methods:", names.join(","));
  console.log("has vals:", typeof wp.vals, "has toCompound:", typeof wp.toCompound, "has shapes:", typeof wp.shapes);
}, 60_000);
