import type { ExamQuestion, QuestionType } from "@/lib/admin/types";

/** Browser + Node safe UUID — avoids importing Node `crypto` in client bundles. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function defaultQuestion(type: QuestionType = "mcq", order = 1): ExamQuestion {
  const opt = (n: number) => ({ id: newId(), text: `Option ${n}` });
  if (type === "true_false") {
    const t = { id: newId(), text: "True" };
    const f = { id: newId(), text: "False" };
    return {
      id: newId(),
      text: "",
      type: "true_false",
      options: [t, f],
      correctOptionIds: [t.id],
      marks: 1,
      order,
    };
  }
  const options = [opt(1), opt(2), opt(3), opt(4)];
  return {
    id: newId(),
    text: "",
    type,
    options,
    correctOptionIds: [options[0].id],
    marks: 1,
    order,
  };
}
