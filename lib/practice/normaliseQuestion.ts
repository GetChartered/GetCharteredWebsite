import type {
  PracticeOption,
  PracticeQuestion,
  PracticeQuestionType,
  RawGcQuestion,
} from "@/lib/practice/types";

function toKeyArray(v: unknown): string[] {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.map((x) => String(x).trim()).filter((s) => s.length > 0);
}

// Options may arrive as an object map ({"A": "text", ...}) or a plain array
// (["text", "text", ...], in which case we synthesise A/B/C... keys).
function optionsFrom(raw: RawGcQuestion): PracticeOption[] {
  const source = raw.options ?? raw.answers;

  if (source && typeof source === "object" && !Array.isArray(source)) {
    return Object.entries(source as Record<string, unknown>).map(([key, text]) => ({
      key,
      text: String(text ?? ""),
    }));
  }

  if (Array.isArray(source)) {
    return source.map((text, i) => ({
      key: String.fromCharCode(65 + i),
      text: String(text ?? ""),
    }));
  }

  return [];
}

// `feedback`/`explanation` may be a plain string or a per-option-key map
// (mirrors the mobile app's contract for the same backend).
function explanationFor(raw: RawGcQuestion, correctKeys: string[]): string | null {
  const rawExplanation = raw.feedback ?? raw.explanation ?? null;
  if (typeof rawExplanation === "string") return rawExplanation;
  if (rawExplanation && typeof rawExplanation === "object") {
    const map = rawExplanation as Record<string, unknown>;
    const forFirstCorrect = correctKeys[0] ? map[correctKeys[0]] : undefined;
    const value = forFirstCorrect ?? Object.values(map)[0];
    return typeof value === "string" ? value : null;
  }
  return null;
}

function questionTypeFrom(raw: RawGcQuestion): PracticeQuestionType {
  const s = String(raw.question_type ?? raw.type ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (s.includes("multiple_response") || s === "mr" || s === "multi_select") {
    return "multiple_response";
  }
  return "mcq";
}

/**
 * Normalises one raw GetCharteredQuestions item into a PracticeQuestion, or
 * returns null if it can't be safely rendered/graded — missing stem, fewer
 * than 2 options, no resolvable correct-answer key, or a multi-part question
 * (parts/sub_questions/statements — not supported in this first Quick
 * Practice pass). Dropped questions are counted by the caller and logged.
 */
export function normaliseGcQuestion(
  raw: RawGcQuestion,
  fallbackModule: string
): PracticeQuestion | null {
  const questionIdRaw = raw.id ?? raw.questionId ?? raw._id;
  const questionText =
    typeof raw.question === "string"
      ? raw.question
      : typeof raw.questionText === "string"
        ? raw.questionText
        : "";

  if (!questionIdRaw || !questionText) return null;

  const hasParts =
    (Array.isArray(raw.parts) && raw.parts.length > 0) ||
    (Array.isArray(raw.sub_questions) && raw.sub_questions.length > 0) ||
    (Array.isArray(raw.statements) && raw.statements.length > 0);
  if (hasParts) return null;

  const options = optionsFrom(raw);
  if (options.length < 2) return null;

  const correctKeysRaw = toKeyArray(raw.correct_answer);
  const optionKeySet = new Set(options.map((o) => o.key));

  // A correct-answer entry may be an option key ("A") or the option's text
  // itself — resolve either way, dropping anything that resolves to nothing.
  const correctKeys = correctKeysRaw
    .map((k) => {
      if (optionKeySet.has(k)) return k;
      const byText = options.find(
        (o) => o.text.trim().toLowerCase() === k.trim().toLowerCase()
      );
      return byText ? byText.key : null;
    })
    .filter((k): k is string => k !== null);

  if (correctKeys.length === 0) return null;

  const questionType = questionTypeFrom(raw);
  const selectCountRaw = raw.select_count;
  const selectCount =
    questionType === "multiple_response"
      ? correctKeys.length ||
        (typeof selectCountRaw === "number" ? selectCountRaw : 2)
      : 1;

  const moduleCode =
    typeof raw.module === "string" && raw.module.length > 0
      ? raw.module
      : fallbackModule;

  // Mirrors GetChartered_app's Learning/Utils/normaliseQuestion.ts: prefer
  // _taxTableRef, fall back to taxTableRef.
  const taxTableRefRaw =
    Array.isArray(raw._taxTableRef) && raw._taxTableRef.length > 0
      ? raw._taxTableRef
      : Array.isArray(raw.taxTableRef) && raw.taxTableRef.length > 0
        ? raw.taxTableRef
        : [];
  const taxTableRef = taxTableRefRaw.filter((r): r is string => typeof r === "string");

  return {
    questionId: String(questionIdRaw),
    module: moduleCode,
    questionText,
    scenario: typeof raw.scenario === "string" ? raw.scenario : null,
    options,
    correctKeys,
    selectCount,
    questionType,
    explanation: explanationFor(raw, correctKeys),
    topic: typeof raw._topic === "string" ? raw._topic : null,
    taxTableRef,
  };
}
