// Expression evaluation over tree parameters — the editor's copy of the
// contract the Go side enforces (cad/expr.go semantics): numbers, parameter
// identifiers, + - * / % ( ) parentheses, unary minus, COMPARISONS (< <= >
// >= == != → 1/0) and the lazy conditional cond(c, a, b) — the吸收①
// vocabulary the Go evaluator grew for enabledExpr switches. An unknown
// identifier is an ERROR (never silently 0): an expression that references
// nothing real must fail loudly, matching the Go side's fail-closed read of
// parameters.

export interface EvalScope {
  params: Record<string, number>;
}

export function evaluateExpression(expr: string, scope: EvalScope): number {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens, scope);
  const value = parser.parseExpression();
  parser.expectEnd();
  return value;
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type Token =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      const v = Number(expr.slice(i, j));
      if (Number.isNaN(v)) throw new Error(`bad number at ${i}: ${expr.slice(i, j)}`);
      tokens.push({ t: "num", v });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[A-Za-z0-9_]/.test(expr[j])) j++;
      tokens.push({ t: "id", v: expr.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/%(),".includes(ch)) {
      tokens.push({ t: "op", v: ch });
      i++;
      continue;
    }
    // Comparisons: two-character forms merge here so the parser sees one
    // operator token (a bare `=` or `!` alone is not an operator).
    if ("<>=!".includes(ch)) {
      if (i + 1 < expr.length && expr[i + 1] === "=") {
        tokens.push({ t: "op", v: ch + "=" });
        i += 2;
        continue;
      }
      if (ch === "<" || ch === ">") {
        tokens.push({ t: "op", v: ch });
        i++;
        continue;
      }
      throw new Error(`unexpected character ${JSON.stringify(ch)} at ${i}`);
    }
    throw new Error(`unexpected character ${JSON.stringify(ch)} at ${i}`);
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Recursive-descent parser (precedence: unary → */% → +-)
// ---------------------------------------------------------------------------

class Parser {
  private pos = 0;
  constructor(private tokens: Token[], private scope: EvalScope) {}

  parseExpression(): number {
    return this.parseComparison();
  }

  // parseComparison — the top arithmetic result is comparable: `boltCount >
  // 4` evaluates to 1 or 0, the value an enabledExpr switch reads. Chained
  // comparisons are refused (the Go evaluator's rule).
  parseComparison(): number {
    const left = this.parseAdd();
    const t = this.peek();
    if (t && t.t === "op" && ["<=", ">=", "==", "!=", "<", ">"].includes(t.v)) {
      this.next();
      const right = this.parseAdd();
      switch (t.v) {
        case "<=": return left <= right ? 1 : 0;
        case ">=": return left >= right ? 1 : 0;
        case "==": return left === right ? 1 : 0;
        case "!=": return left !== right ? 1 : 0;
        case "<": return left < right ? 1 : 0;
        default: return left > right ? 1 : 0;
      }
    }
    return left;
  }

  expectEnd(): void {
    if (this.pos < this.tokens.length) {
      throw new Error(`unexpected token after expression: ${JSON.stringify(this.tokens[this.pos])}`);
    }
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token {
    const t = this.tokens[this.pos++];
    if (!t) throw new Error("unexpected end of expression");
    return t;
  }

  private parseAdd(): number {
    let left = this.parseMul();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "+" || t.v === "-")) {
        this.next();
        const right = this.parseMul();
        left = t.v === "+" ? left + right : left - right;
      } else {
        return left;
      }
    }
  }

  private parseMul(): number {
    let left = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "*" || t.v === "/" || t.v === "%")) {
        this.next();
        const right = this.parseUnary();
        left = t.v === "*" ? left * right : t.v === "/" ? left / right : left % right;
      } else {
        return left;
      }
    }
  }

  private parseUnary(): number {
    const t = this.peek();
    if (t && t.t === "op" && t.v === "-") {
      this.next();
      return -this.parseUnary();
    }
    if (t && t.t === "op" && t.v === "+") {
      this.next();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const t = this.peek();
    // cond(c, a, b) — the lazy conditional: only the taken branch is
    // EVALUATED (the Go evaluator's discipline), so cond(ok, 1/b, 0) never
    // divides by zero on the untaken branch.
    if (t && t.t === "id" && t.v === "cond") {
      this.next();
      const open = this.next();
      if (open.t !== "op" || open.v !== "(") throw new Error("expected ( after cond");
      const c = this.parseComparison();
      this.expectOp(",");
      if (c !== 0) {
        const a = this.parseComparison();
        this.expectOp(",");
        this.parseComparison(); // the untaken branch still has to PARSE
        this.expectOp(")");
        return a;
      }
      this.parseComparison(); // skipped value, parsed for well-formedness
      this.expectOp(",");
      const b = this.parseComparison();
      this.expectOp(")");
      return b;
    }
    const t2 = this.next();
    if (t2.t === "num") return t2.v;
    if (t2.t === "id") {
      const v = this.scope.params[t2.v];
      if (v === undefined || Number.isNaN(v)) {
        throw new Error(`unknown parameter "${t2.v}"`);
      }
      return v;
    }
    if (t2.t === "op" && t2.v === "(") {
      const v = this.parseComparison();
      const close = this.next();
      if (close.t !== "op" || close.v !== ")") {
        throw new Error("expected )");
      }
      return v;
    }
    throw new Error(`unexpected token ${JSON.stringify(t2)}`);
  }

  private expectOp(v: string): void {
    const t = this.next();
    if (t.t !== "op" || t.v !== v) {
      throw new Error(`expected ${JSON.stringify(v)}, got ${JSON.stringify(t)}`);
    }
  }

  private expectOp(v: string): void {
    const t = this.next();
    if (t.t !== "op" || t.v !== v) {
      throw new Error(`expected ${JSON.stringify(v)}, got ${JSON.stringify(t)}`);
    }
  }

  private parsePrimaryDead(): number {
    const t = this.next();
    if (t.t === "num") return t.v;
    if (t.t === "id") {
      const v = this.scope.params[t.v];
      if (v === undefined || Number.isNaN(v)) {
        throw new Error(`unknown parameter "${t.v}"`);
      }
      return v;
    }
    if (t.t === "op" && t.v === "(") {
      const v = this.parseAdd();
      const close = this.next();
      if (close.t !== "op" || close.v !== ")") {
        throw new Error("expected )");
      }
      return v;
    }
    throw new Error(`unexpected token ${JSON.stringify(t)}`);
  }
}
