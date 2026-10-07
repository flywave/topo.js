import { it } from "vitest";
import { loadKernel } from "../src/engine/kernel.js";

it("probe shape statics", async () => {
  const tp = await loadKernel();
  const wp = new tp.Workplane("XY", undefined, undefined);
  const pts = [[0,0],[30,0],[30,20],[0,20]].map(([x,y]) => new tp.gp_Pnt_3(x,y,0));
  wp.polyline(pts, false, false);
  wp.close();
  const body = wp.extrude(10, true, true, false, undefined);
  const shape = body.vals()[0];
  console.log("shape ctor:", shape.constructor.name);
  const proto = Object.getPrototypeOf(shape);
  const staticsOnCtor = Object.getOwnPropertyNames(shape.constructor);
  console.log("ctor statics:", staticsOnCtor.filter(n => /cut|fuse|intersect/i.test(n)).join(","));
  const protoNames = Object.getOwnPropertyNames(proto).filter(n => /cut|fuse|intersect/i.test(n));
  console.log("proto methods:", protoNames.join(","));
}, 120_000);
