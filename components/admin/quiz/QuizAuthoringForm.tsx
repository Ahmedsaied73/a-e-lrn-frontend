"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertQuiz } from "@/services/adminQuizService";
import type { StudentSafeQuiz, UpsertQuizInput } from "@/types/quiz";

type QuestionType = "radiogroup" | "comment" | "html" | "image";

interface AuthorQuestion {
  id: string;
  type: QuestionType;
  name: string;
  title: string;
  points: string;
  choicesText: string;
  correctValue: string;
  modelAnswer: string;
  html: string;
  imageLink: string;
}

interface QuizAuthoringFormProps {
  videoId: string;
}

function newQuestion(): AuthorQuestion {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: "radiogroup",
    name: "",
    title: "",
    points: "1",
    choicesText: "",
    correctValue: "",
    modelAnswer: "",
    html: "",
    imageLink: "",
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "تعذر حفظ الاختبار.";
}

function parseChoices(value: string) {
  return value
    .split("\n")
    .map((line, index) => {
      const [rawValue, ...rawText] = line.split("|");
      const choiceValue = rawValue.trim() || String(index + 1);
      return { value: choiceValue, text: rawText.join("|").trim() || choiceValue };
    })
    .filter((choice) => choice.text);
}

function buildPayload(title: string, timeLimit: string, passingScore: string, questions: AuthorQuestion[]): UpsertQuizInput {
  const elements = questions.map((question) => {
    const base = { type: question.type, name: question.name.trim(), title: question.title.trim() };
    if (question.type === "radiogroup") return { ...base, choices: parseChoices(question.choicesText) };
    if (question.type === "comment") return base;
    if (question.type === "html") return { ...base, html: question.html };
    return { ...base, imageLink: question.imageLink.trim() };
  });

  const answerKey: Record<string, unknown> = {};
  for (const question of questions) {
    if (question.type === "radiogroup") {
      answerKey[question.name.trim()] = {
        type: question.type,
        correctValue: question.correctValue.trim(),
        points: Number(question.points),
      };
    } else if (question.type === "comment") {
      answerKey[question.name.trim()] = {
        type: question.type,
        modelAnswer: question.modelAnswer.trim(),
        points: Number(question.points),
      };
    }
  }

  return {
    title: title.trim(),
    timeLimitSec: timeLimit.trim() ? Number(timeLimit) : null,
    passingScore: Number(passingScore),
    surveyJson: { pages: [{ name: "page1", elements }] },
    answerKey,
  };
}

export default function QuizAuthoringForm({ videoId }: QuizAuthoringFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("50");
  const [questions, setQuestions] = useState<AuthorQuestion[]>([newQuestion()]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuiz, setSavedQuiz] = useState<StudentSafeQuiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateQuestion = (id: string, patch: Partial<AuthorQuestion>) => {
    setQuestions((current) => current.map((question) => question.id === id ? { ...question, ...patch } : question));
  };

  const validate = (): string | null => {
    if (!title.trim()) return "عنوان الاختبار مطلوب.";
    const score = Number(passingScore);
    if (!Number.isInteger(score) || score < 0 || score > 100) return "نسبة النجاح يجب أن تكون بين 0 و100.";
    if (timeLimit.trim() && (!Number.isInteger(Number(timeLimit)) || Number(timeLimit) <= 0)) return "المدة يجب أن تكون رقماً صحيحاً موجباً.";

    const names = new Set<string>();
    for (const question of questions) {
      const name = question.name.trim();
      if (!name) return "اسم كل عنصر مطلوب.";
      if (names.has(name)) return `اسم السؤال مكرر: ${name}`;
      names.add(name);
      if (question.type === "radiogroup") {
        const choices = parseChoices(question.choicesText);
        if (choices.length < 2) return `أضف خيارين على الأقل للسؤال ${name}.`;
        if (!question.correctValue.trim() || !choices.some((choice) => choice.value === question.correctValue.trim())) {
          return `حدد إجابة صحيحة موجودة للسؤال ${name}.`;
        }
      }
      if ((question.type === "radiogroup" || question.type === "comment") && Number(question.points) <= 0) {
        return `نقاط السؤال ${name} يجب أن تكون أكبر من صفر.`;
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const result = await upsertQuiz(videoId, buildPayload(title, timeLimit, passingScore, questions));
      setSavedQuiz(result);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} dir="rtl" className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">إنشاء اختبار للفيديو {videoId}</h1>
        <p className="mt-1 text-sm text-slate-500">الحفظ يستبدل تعريف الاختبار الحالي لهذا الفيديو.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="sm:col-span-3 text-sm font-semibold text-slate-700">عنوان الاختبار
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">المدة بالثواني (اختياري)
            <input type="number" min="1" value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">نسبة النجاح
            <input type="number" min="0" max="100" value={passingScore} onChange={(event) => setPassingScore(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
          </label>
        </div>
      </section>

      {questions.map((question, index) => (
        <section key={question.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">العنصر {index + 1}</h2>
            <button type="button" onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))} disabled={questions.length === 1} className="text-sm font-semibold text-rose-600 disabled:opacity-40">حذف</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">النوع
              <select value={question.type} onChange={(event) => updateQuestion(question.id, { type: event.target.value as QuestionType })} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5">
                <option value="radiogroup">اختيار من متعدد</option><option value="comment">مقالي</option><option value="html">HTML للعرض</option><option value="image">صورة للعرض</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">المعرف
              <input value={question.name} onChange={(event) => updateQuestion(question.id, { name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
            </label>
            <label className="sm:col-span-2 text-sm font-semibold text-slate-700">العنوان
              <input value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
            </label>
            {(question.type === "radiogroup" || question.type === "comment") && <label className="text-sm font-semibold text-slate-700">النقاط
              <input type="number" min="1" value={question.points} onChange={(event) => updateQuestion(question.id, { points: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
            </label>}
            {question.type === "radiogroup" && <>
              <label className="text-sm font-semibold text-slate-700">الخيارات (كل سطر: value | النص)
                <textarea value={question.choicesText} onChange={(event) => updateQuestion(question.id, { choicesText: event.target.value })} className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 p-2.5" />
              </label>
              <label className="text-sm font-semibold text-slate-700">قيمة الإجابة الصحيحة
                <input value={question.correctValue} onChange={(event) => updateQuestion(question.id, { correctValue: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
              </label>
            </>}
            {question.type === "comment" && <label className="sm:col-span-2 text-sm font-semibold text-slate-700">الإجابة النموذجية
              <textarea value={question.modelAnswer} onChange={(event) => updateQuestion(question.id, { modelAnswer: event.target.value })} className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 p-2.5" />
            </label>}
            {question.type === "html" && <label className="sm:col-span-2 text-sm font-semibold text-slate-700">محتوى العرض
              <textarea value={question.html} onChange={(event) => updateQuestion(question.id, { html: event.target.value })} className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 p-2.5" />
            </label>}
            {question.type === "image" && <label className="sm:col-span-2 text-sm font-semibold text-slate-700">رابط الصورة
              <input value={question.imageLink} onChange={(event) => updateQuestion(question.id, { imageLink: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
            </label>}
          </div>
        </section>
      ))}

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
      {savedQuiz && <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
        <span>تم حفظ الاختبار بنجاح.</span>
        <button type="button" onClick={() => router.push(`/admin/quizzes/quiz/${savedQuiz.id}/attempts`)} className="rounded-lg bg-emerald-600 px-3 py-2 text-white">فتح طابور التصحيح</button>
      </div>}
      <div className="flex gap-3">
        <button type="button" onClick={() => setQuestions((current) => [...current, newQuestion()])} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700">إضافة عنصر</button>
        <button type="submit" disabled={isSaving} className="rounded-lg bg-[#207bff] px-5 py-2.5 font-bold text-white disabled:opacity-60">{isSaving ? "جاري الحفظ..." : "حفظ الاختبار"}</button>
      </div>
    </form>
  );
}
