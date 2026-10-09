// 吸收①对齐: the editor's evaluator carries the Go comparison/cond
// vocabulary (cad/expr.go parity).
import { describe, expect, it } from "vitest";
import { evaluateExpression } from "../src/engine/expr.js";

describe("comparison and conditional expressions (吸收① parity)", () => {
  const params = { boltCount: 6, minBolts: 4, b: 0 };
  const cases: Array<[string, number]> = [
    ["boltCount > 4", 1],
    ["boltCount > 8", 0],
    ["boltCount >= 6", 1],
    ["boltCount < minBolts", 0],
    ["boltCount <= 6", 1],
    ["boltCount == 6", 1],
    ["boltCount != 6", 0],
    ["cond(boltCount > 4, 10, 20)", 10],
    ["cond(boltCount > 8, 10, 20)", 20],
    ["cond(b > 0, 1 / b, 5)", 5], // lazy: the untaken branch divides by zero
    ["(boltCount > 4) * 3 + 1", 4],
  ];
  for (const [expr, want] of cases) {
    it(`${expr} === ${want}`, () => {
      expect(evaluateExpression(expr, { params })).toBe(want);
    });
  }
  it("refuses chained comparisons", () => {
    expect(() => evaluateExpression("1 < 2 < 3", { params })).toThrow();
  });
  it("refuses a bare =", () => {
    expect(() => evaluateExpression("1 = 2", { params })).toThrow();
  });
});
