import { describe, expect, it } from "vitest";
import { evaluateExpression, resolveParameters, ExpressionError } from "../lib/cad/expr.js";

describe("expression evaluator", () => {
  it("evaluates arithmetic with precedence", () => {
    expect(evaluateExpression("2 + 3 * 4", {})).toBe(14);
    expect(evaluateExpression("(2 + 3) * 4", {})).toBe(20);
    expect(evaluateExpression("10 / 4", {})).toBe(2.5);
    expect(evaluateExpression("-5 + 2", {})).toBe(-3);
    expect(evaluateExpression("2 ^ 3", {})).toBe(8);
  });

  it("resolves parameter references", () => {
    expect(evaluateExpression("thickness * 0.6", { thickness: 10 })).toBeCloseTo(6);
  });

  it("supports the function set", () => {
    expect(evaluateExpression("min(3, 7)", {})).toBe(3);
    expect(evaluateExpression("max(3, 7)", {})).toBe(7);
    expect(evaluateExpression("round(2.6)", {})).toBe(3);
    expect(evaluateExpression("sqrt(16)", {})).toBe(4);
    expect(evaluateExpression("abs(0 - 9)", {})).toBe(9);
  });

  it("throws on unknown parameters rather than silently producing NaN", () => {
    expect(() => evaluateExpression("missing * 2", {})).toThrow(ExpressionError);
  });

  it("throws on division by zero", () => {
    expect(() => evaluateExpression("1 / 0", {})).toThrow(/Division by zero/);
  });

  it("rejects code injection", () => {
    expect(() => evaluateExpression("process.exit(1)", {})).toThrow();
    expect(() => evaluateExpression("globalThis", {})).toThrow();
  });
});

describe("parameter resolution", () => {
  it("resolves chains regardless of declaration order", () => {
    const r = resolveParameters([
      { name: "boreDiameter", expr: "plateThickness * 0.8" },
      { name: "plateThickness", expr: "10" },
      { name: "wall", expr: "(plateThickness - boreDiameter) / 2" },
    ]);
    expect(r.errors).toEqual([]);
    expect(r.values.plateThickness).toBe(10);
    expect(r.values.boreDiameter).toBeCloseTo(8);
    expect(r.values.wall).toBeCloseTo(1);
    expect(r.unresolved).toEqual([]);
  });

  it("reports circular references instead of looping forever", () => {
    const r = resolveParameters([
      { name: "a", expr: "b + 1" },
      { name: "b", expr: "a + 1" },
    ]);
    expect(r.unresolved.sort()).toEqual(["a", "b"]);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("reports an unknown dependency", () => {
    const r = resolveParameters([{ name: "a", expr: "nonexistent * 2" }]);
    expect(r.values.a).toBeUndefined();
    expect(r.errors[0].name).toBe("a");
  });

  it("converts a parameter's own unit before it feeds other expressions", () => {
    const r = resolveParameters([
      { name: "thickness", expr: "0.5", unit: "in" },
      { name: "holeDiameter", expr: "thickness * 0.6" },
    ]);
    // 0.5in = 12.7mm, so the hole is 7.62mm — not 0.3 raw numbers.
    expect(r.values.thickness).toBeCloseTo(12.7);
    expect(r.values.holeDiameter).toBeCloseTo(7.62);
  });
});
