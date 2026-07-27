import type { ExamQuestion, QuestionType } from "./types";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type ImportQuestionRow = {
  text: string;
  type: QuestionType;
  options: string[];
  correctIndices: number[];
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  category?: string;
  tags?: string[];
};

const VALID_TYPES: QuestionType[] = ["mcq", "true_false", "multi_select"];

function parseType(raw: string): QuestionType {
  const t = raw.trim().toLowerCase().replace(/-/g, "_");
  if (VALID_TYPES.includes(t as QuestionType)) return t as QuestionType;
  if (t === "truefalse" || t === "tf") return "true_false";
  if (t === "multiselect" || t === "multi") return "multi_select";
  return "mcq";
}

function parseCorrectIndices(raw: unknown, optionCount: number): number[] {
  if (Array.isArray(raw)) {
    return raw.map(Number).filter((n) => n >= 0 && n < optionCount);
  }
  if (typeof raw === "number") return raw >= 0 && raw < optionCount ? [raw] : [];
  if (typeof raw === "string") {
    return raw
      .split(/[,|;]/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n < optionCount);
  }
  return [];
}

export function importRowToExamQuestion(row: ImportQuestionRow, order: number): ExamQuestion {
  const options = row.options.map((text) => ({ id: uid(), text: String(text).trim() }));
  const correctOptionIds = row.correctIndices
    .map((i) => options[i]?.id)
    .filter(Boolean) as string[];

  return {
    id: uid(),
    text: row.text.trim(),
    type: row.type,
    options,
    correctOptionIds: correctOptionIds.length ? correctOptionIds : options[0] ? [options[0].id] : [],
    marks: row.marks || 1,
    negativeMarks: row.negativeMarks,
    order,
    explanation: row.explanation,
  };
}

/** Parse JSON array of questions */
export function parseQuestionsJson(raw: string): ImportQuestionRow[] {
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) throw new Error("JSON must be an array of questions");

  return data.map((item, idx) => {
    const obj = item as Record<string, unknown>;
    const optionsRaw = obj.options ?? obj.choices ?? [];
    let options: string[] = [];
    if (Array.isArray(optionsRaw)) {
      options = optionsRaw.map((o) =>
        typeof o === "string" ? o : String((o as { text?: string }).text ?? ""),
      );
    }
    if (obj.type === "true_false" || parseType(String(obj.type ?? "mcq")) === "true_false") {
      options = ["True", "False"];
    }
    const correctRaw = obj.correct ?? obj.correctIndex ?? obj.correctOptionIds ?? obj.answer ?? 0;
    let correctIndices = parseCorrectIndices(correctRaw, options.length);
    if (Array.isArray(obj.correctOptionIds) && options.length) {
      correctIndices = (obj.correctOptionIds as string[])
        .map((id) => options.findIndex((_, i) => String(i) === id || options[i] === id))
        .filter((i) => i >= 0);
    }

    const text = String(obj.text ?? obj.question ?? "");
    if (!text.trim()) throw new Error(`Question ${idx + 1}: text is required`);

    return {
      text,
      type: parseType(String(obj.type ?? "mcq")),
      options,
      correctIndices,
      marks: Number(obj.marks ?? obj.points ?? 1),
      negativeMarks: obj.negativeMarks != null ? Number(obj.negativeMarks) : undefined,
      explanation: obj.explanation ? String(obj.explanation) : undefined,
      category: obj.category ? String(obj.category) : undefined,
      tags: Array.isArray(obj.tags) ? (obj.tags as string[]) : undefined,
    };
  });
}

/** CSV: text,type,options,correct,marks,explanation,category
 * options pipe-separated: A|B|C|D  correct: 0 or 0,2 for multi
 */
export function parseQuestionsCsv(raw: string): ImportQuestionRow[] {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs header + at least one row");

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("text") || header.includes("question");
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line, idx) => {
    const parts = parseCsvLine(line);
    const [text, typeRaw, optionsRaw, correctRaw, marksRaw, explanation, category] = parts;
    if (!text?.trim()) throw new Error(`Row ${idx + 1}: question text required`);

    const type = parseType(typeRaw || "mcq");
    let options = (optionsRaw || "").split("|").map((s) => s.trim()).filter(Boolean);
    if (type === "true_false" && options.length < 2) options = ["True", "False"];

    const correctIndices = parseCorrectIndices(correctRaw ?? "0", options.length);

    return {
      text: text.trim(),
      type,
      options,
      correctIndices,
      marks: Number(marksRaw) || 1,
      explanation: explanation?.trim() || undefined,
      category: category?.trim() || undefined,
    };
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export const QUESTION_IMPORT_SAMPLE_JSON = `[
  {
    "text": "What is the capital of India?",
    "type": "mcq",
    "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
    "correct": 1,
    "marks": 1,
    "explanation": "New Delhi is the capital of India."
  },
  {
    "text": "JavaScript runs only in browsers.",
    "type": "true_false",
    "options": ["True", "False"],
    "correct": 1,
    "marks": 1
  }
]`;

export const QUESTION_IMPORT_SAMPLE_CSV = `text,type,options,correct,marks,explanation,category
"What is 2+2?","mcq","3|4|5|6",1,1,"Basic math","Math"
"HTML is a programming language","true_false","True|False",1,1,"HTML is markup","Web"`;
