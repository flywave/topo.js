import { it } from "vitest";
it("env", () => {
  console.log("K=", process.env.CADGEN_EDITOR_KERNEL, "G=", process.env.CADGEN_GOLDENS);
});
