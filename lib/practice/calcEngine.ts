// Pure calculator engine, ported verbatim from GetChartered_app's
// components/calculator/calcEngine.ts — no React/DOM imports, confirmed
// framework-agnostic in the app's own header comment ("Pure calculator
// engine — no React, no react-native imports — so it can be unit tested
// directly"). components/practice/CalculatorModal.tsx is a thin view over
// this: it holds a CalcState, calls `next(state, button)` on each key
// press, and renders `deriveDisplay(state)`.

// ─── Expression evaluator (recursive descent, no eval) ───────────────────────

export function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (expr[i] === " ") { i++; continue; }
    if (/\d/.test(expr[i]) || (expr[i] === "." && /\d/.test(expr[i + 1] ?? ""))) {
      let num = "";
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) num += expr[i++];
      tokens.push(num);
    } else {
      tokens.push(expr[i++]);
    }
  }
  return tokens;
}

function evalTokens(tokens: string[]): number {
  let pos = 0;

  function peek() { return tokens[pos]; }
  function consume() { return tokens[pos++]; }

  function parseExpr(): number {
    let left = parseTerm();
    while (peek() === "+" || peek() === "−" || peek() === "-") {
      const op = consume();
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseUnary();
    while (peek() === "×" || peek() === "÷") {
      const op = consume();
      const right = parseUnary();
      if (op === "÷") { left = right === 0 ? NaN : left / right; }
      else left *= right;
    }
    return left;
  }

  function parseUnary(): number {
    if (peek() === "−" || peek() === "-") { consume(); return -parsePrimary(); }
    if (peek() === "+") { consume(); return parsePrimary(); }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const tok = peek();
    if (tok === "(") {
      consume();
      const val = parseExpr();
      if (peek() === ")") consume();
      return val;
    }
    if (tok !== undefined && /^-?\d*\.?\d+$/.test(tok)) {
      consume();
      let val = Number(tok);
      // A trailing "%" token means "divide by 100" (so "5 %" → 0.05). This lets
      // the expression keep its readable "5%" form while still evaluating right.
      if (peek() === "%") { consume(); val = val / 100; }
      return val;
    }
    return NaN;
  }

  try {
    const result = parseExpr();
    return typeof result === "number" ? result : NaN;
  } catch {
    return NaN;
  }
}

export function evaluate(expr: string): number {
  return evalTokens(tokenize(expr));
}

export function fmt(n: number): string {
  return String(Number(n.toFixed(10)));
}

// ─── Button layout ────────────────────────────────────────────────────────────

// Single smart-parenthesis key: inserts "(" when a value is expected, otherwise
// closes an open group. Frees a slot for "%" without losing bracket support.
export const PAREN = "( )";

export const BUTTON_ROWS = [
  ["C", PAREN, "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["+/-", "0", ".", "="],
] as const;

export const OPERATORS = ["+", "−", "×", "÷"];
export const LIGHT_BTN = ["C", PAREN, "%", "+/-"];

// ─── State ────────────────────────────────────────────────────────────────────

export type CalcState = {
  expression: string; // built expression shown in top row, e.g. "12 + ( 5 × "
  input: string;      // number currently being typed; "" means no active input
  justEvaled: boolean;
  parenDepth: number;
};

export const INITIAL: CalcState = { expression: "", input: "", justEvaled: false, parenDepth: 0 };

// ─── State machine ────────────────────────────────────────────────────────────

export function next(prev: CalcState, btn: string): CalcState {
  // Digit
  if (/^\d$/.test(btn)) {
    if (prev.justEvaled) return { ...INITIAL, input: btn };
    // A "%"-tagged number is complete; a new digit starts a fresh number.
    if (prev.input.endsWith("%")) return { ...prev, input: btn, justEvaled: false };
    const newInput = prev.input === "" ? btn : prev.input + btn;
    return { ...prev, input: newInput, justEvaled: false };
  }

  // Decimal point
  if (btn === ".") {
    if (prev.justEvaled) return { ...INITIAL, input: "0." };
    if (prev.input.endsWith("%")) return { ...prev, input: "0.", justEvaled: false };
    if (prev.input.includes(".")) return prev;
    const newInput = prev.input === "" ? "0." : prev.input + ".";
    return { ...prev, input: newInput, justEvaled: false };
  }

  // Clear
  if (btn === "C") return INITIAL;

  // Toggle sign
  if (btn === "+/-") {
    if (prev.input === "" || prev.input === "Error") return prev;
    const toggled = prev.input.startsWith("-") ? prev.input.slice(1) : "-" + prev.input;
    return { ...prev, input: toggled };
  }

  // Percent — tag the current number as a percent (shown as "8%"). The "%" stays
  // in the expression everywhere it's displayed; the evaluator interprets a
  // trailing "%" token as "divide by 100" (see parsePrimary), so "8%" reads as
  // 8% throughout yet computes as 0.08. Composes with × for "50% of X".
  if (btn === "%") {
    if (prev.input === "" || prev.input === "Error") return prev;
    if (prev.input.endsWith("%")) return prev; // already a percent
    const val = Number(prev.input);
    if (isNaN(val)) return prev;
    return { ...prev, input: prev.input + "%", justEvaled: false };
  }

  // Smart parenthesis — one key that opens or closes based on context.
  if (btn === PAREN) {
    const trimmed = prev.expression.trimEnd();
    // A value is expected (so open "(") at the very start, right after an
    // operator, or right after another open bracket — and only when not
    // mid-number.
    const expectsValue =
      prev.input === "" &&
      !prev.justEvaled &&
      (trimmed === "" ||
        trimmed.endsWith("(") ||
        OPERATORS.some((op) => trimmed.endsWith(op)));

    if (expectsValue) {
      return {
        ...prev,
        expression: prev.expression + "( ",
        parenDepth: prev.parenDepth + 1,
      };
    }

    // Otherwise close the innermost open group, consuming the current number.
    if (prev.parenDepth > 0) {
      const inputPart = prev.input === "" ? "0" : prev.input;
      return {
        expression: prev.expression + inputPart + " ) ",
        input: "",
        justEvaled: false,
        parenDepth: prev.parenDepth - 1,
      };
    }

    return prev;
  }

  // Operator
  if (OPERATORS.includes(btn)) {
    if (prev.justEvaled) {
      // Continue building from result
      return {
        expression: prev.input + " " + btn + " ",
        input: "",
        justEvaled: false,
        parenDepth: 0,
      };
    }
    if (prev.input === "") {
      // Replace trailing operator if user changed their mind
      const trimmed = prev.expression.trimEnd();
      const withoutLast = OPERATORS.some((op) => trimmed.endsWith(op))
        ? trimmed.slice(0, trimmed.length - 1).trimEnd() + " " + btn + " "
        : prev.expression + btn + " ";
      return { ...prev, expression: withoutLast };
    }
    return {
      ...prev,
      expression: prev.expression + prev.input + " " + btn + " ",
      input: "",
      justEvaled: false,
    };
  }

  // Equals
  if (btn === "=") {
    const trimmed = prev.expression.trimEnd();
    // Only inject a "0" when the expression is genuinely waiting for a value:
    // it's empty, or ends with an operator or an open bracket. After a closing
    // bracket or a completed number the value is already in the expression, so
    // appending "0" would leave a stray token (e.g. "( 5 × 6 ) 0 =").
    const needsValue =
      prev.input !== "" ||
      trimmed === "" ||
      trimmed.endsWith("(") ||
      OPERATORS.some((op) => trimmed.endsWith(op));
    const inputPart = needsValue ? (prev.input === "" ? "0" : prev.input) : "";
    const closedParens = ")".repeat(prev.parenDepth);
    const exprCore = prev.expression + inputPart;
    const fullExpr = exprCore + closedParens;
    const result = evaluate(fullExpr);
    const resultStr = isNaN(result) ? "Error" : fmt(result);
    return {
      expression: exprCore.trimEnd() + (closedParens ? " " + closedParens : "") + " =",
      input: resultStr,
      justEvaled: true,
      parenDepth: 0,
    };
  }

  return prev;
}

// ─── Display ────────────────────────────────────────────────────────────────

/**
 * Apple-style two-row display derived from state:
 *  • While building, the whole expression grows on the big main row (`main`) and
 *    the small row above (`calc`) stays empty.
 *  • After "=", the calculation moves up to the small row (`calc`) and the answer
 *    takes the big row (`main`).
 */
export function deriveDisplay(s: CalcState): { calc: string; main: string } {
  const calc = s.justEvaled ? s.expression.replace(/\s*=\s*$/, "") : "";
  const liveExpr = (s.expression + s.input).trim();
  const main = s.justEvaled ? s.input : liveExpr === "" ? "0" : liveExpr;
  return { calc, main };
}

/** Convenience: run a full sequence of button presses from INITIAL. */
export function run(buttons: string[], from: CalcState = INITIAL): CalcState {
  return buttons.reduce((state, btn) => next(state, btn), from);
}
