// Expression evaluation over tree parameters — the editor's copy of the
// contract the Go side enforces (interp evalParam semantics): numbers,
// parameter identifiers, + - * / % ( ) parentheses, unary minus, and nothing
// else. An unknown identifier is an ERROR (never silently 0): an expression
// that references nothing real must fail loudly, matching the Go side's
// fail-closed read of parameters.

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
    if ("+-*/%()".includes(ch)) {
      tokens.push({ t: "op", v: ch });
      i++;
      continue;
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
    return this.parseAdd();
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
