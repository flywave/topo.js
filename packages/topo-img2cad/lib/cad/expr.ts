/**
 * Parameter expression evaluator.
 *
 * Driving dimensions are expressions over other parameters, which is what makes
 * a CAD model associative: `holeDiameter = plateThickness * 0.6` means changing
 * the plate thickness moves the hole. Deliberately a small recursive-descent
 * parser rather than `eval`, so specs from an AI can never execute code.
 */

export class ExpressionError extends Error {}

type Token =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string };

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  min: Math.min,
  max: Math.max,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sqrt: Math.sqrt,
  pow: (a, b) => Math.pow(a, b),
  deg: (r) => (r * 180) / Math.PI,
  rad: (d) => (d * Math.PI) / 180,
};

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const num = Number(input.slice(i, j));
      if (!isFinite(num)) throw new ExpressionError(`Bad number "${input.slice(i, j)}"`);
      tokens.push({ t: "num", v: num });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < input.length && /[A-Za-z0-9_]/.test(input[j])) j++;
      tokens.push({ t: "id", v: input.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/^(),".includes(c)) {
      tokens.push({ t: "op", v: c });
      i++;
      continue;
    }
    throw new ExpressionError(`Unexpected character "${c}" in "${input}"`);
  }
  return tokens;
}

class Parser {
  private pos = 0;

  constructor(
    private tokens: Token[],
    private params: Record<string, number>,
    private expr: string,
  ) {}

  parse(): number {
    const v = this.additive();
    if (this.pos < this.tokens.length) {
      throw new ExpressionError(`Trailing input in "${this.expr}"`);
    }
    return v;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private eatOp(...ops: string[]): string | null {
    const tok = this.peek();
    if (tok && tok.t === "op" && ops.includes(tok.v)) {
      this.pos++;
      return tok.v;
    }
    return null;
  }

  private additive(): number {
    let left = this.multiplicative();
    for (;;) {
      const op = this.eatOp("+", "-");
      if (!op) return left;
      const right = this.multiplicative();
      left = op === "+" ? left + right : left - right;
    }
  }

  private multiplicative(): number {
    let left = this.unary();
    for (;;) {
      const op = this.eatOp("*", "/");
      if (!op) return left;
      const right = this.unary();
      if (op === "/") {
        if (right === 0) throw new ExpressionError(`Division by zero in "${this.expr}"`);
        left = left / right;
      } else {
        left = left * right;
      }
    }
  }

  private unary(): number {
    if (this.eatOp("-")) return -this.unary();
    return this.power();
  }

  private power(): number {
    const base = this.primary();
    if (this.eatOp("^")) {
      return Math.pow(base, this.unary());
    }
    return base;
  }

  private primary(): number {
    const tok = this.peek();
    if (!tok) throw new ExpressionError(`Unexpected end of "${this.expr}"`);

    if (tok.t === "num") {
      this.pos++;
      return tok.v;
    }

    if (tok.t === "id") {
      this.pos++;
      const name = tok.v;
      // Function call
      if (this.eatOp("(")) {
        const args: number[] = [];
        if (!this.eatOp(")")) {
          for (;;) {
            args.push(this.additive());
            if (this.eatOp(")")) break;
            if (!this.eatOp(",")) throw new ExpressionError(`Expected , or ) in "${this.expr}"`);
          }
        }
        const fn = FUNCTIONS[name];
        if (!fn) throw new ExpressionError(`Unknown function "${name}" in "${this.expr}"`);
        return fn(...args);
      }
      // Constant
      if (name === "PI" || name === "pi") return Math.PI;
      if (name === "E") return Math.E;
      // Parameter reference
      if (!(name in this.params)) {
        throw new ExpressionError(`Unknown parameter "${name}" referenced in "${this.expr}"`);
      }
      return this.params[name];
    }

    if (this.eatOp("(")) {
      const v = this.additive();
      if (!this.eatOp(")")) throw new ExpressionError(`Missing ) in "${this.expr}"`);
      return v;
    }

    throw new ExpressionError(`Unexpected token in "${this.expr}"`);
  }
}

/** Evaluate an expression against already-resolved parameter values. */
export function evaluateExpression(expr: string, params: Record<string, number>): number {
  const trimmed = expr.trim();
  if (trimmed === "") throw new ExpressionError("Empty expression");
  const tokens = tokenize(trimmed);
  return new Parser(tokens, params, trimmed).parse();
}

export interface ResolvedParameters {
  values: Record<string, number>;
  /** Parameters in the order they were successfully resolved. */
  order: string[];
  errors: Array<{ name: string; expr: string; message: string }>;
  /** Names that could not be resolved (cycle or bad expression). */
  unresolved: string[];
}

/**
 * Resolve a parameter set, following references between parameters.
 *
 * Resolution is iterative rather than topological so a forward reference works
 * as well as a backward one; anything left after the passes either cycles or is
 * genuinely broken, and is reported rather than guessed.
 */
export function resolveParameters(
  params: Array<{ name: string; expr: string; unit?: string }>,
): ResolvedParameters {
  const byName = new Map(params.map((p) => [p.name, p]));
  const values: Record<string, number> = {};
  const order: string[] = [];
  const errors: ResolvedParameters["errors"] = [];

  let pending = params.map((p) => p.name);
  let progressed = true;

  while (pending.length > 0 && progressed) {
    progressed = false;
    const next: string[] = [];
    for (const name of pending) {
      const p = byName.get(name);
      if (!p) continue;
      // Values already resolved are expressed in the target unit (mm). A
      // parameter written in inches must be converted before it feeds an
      // expression, otherwise `thickness*2` silently mixes units.
      try {
        const raw = evaluateExpression(p.expr, values);
        values[name] = applyUnit(raw, p);
        order.push(name);
        progressed = true;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (referencesUnresolved(p.expr, pending)) {
          next.push(name);
        } else {
          errors.push({ name, expr: p.expr, message });
        }
      }
    }
    pending = next;
  }

  for (const name of pending) {
    const p = byName.get(name);
    errors.push({
      name,
      expr: p?.expr ?? "",
      message: `Cannot resolve "${name}" — circular reference or missing dependency`,
    });
  }

  return { values, order, errors, unresolved: pending };
}

/** A parameter whose own unit is non-mm must be scaled into mm. */
function applyUnit(raw: number, p: { expr: string; unit?: string }): number {
  if (!p.unit || p.unit === "deg") return raw;
  const factor: Record<string, number> = { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 };
  const f = factor[p.unit];
  if (f === undefined) return raw;
  // Only scale bare numeric literals — a reference to another parameter is
  // already in mm.
  return /^[\s\d.+\-*/^()]+$/.test(p.expr) ? raw * f : raw;
}

function referencesUnresolved(expr: string, pending: string[]): boolean {
  const set = new Set(pending);
  for (const m of expr.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) {
    if (set.has(m[0]) && !(m[0] in FUNCTIONS)) return true;
  }
  return false;
}
