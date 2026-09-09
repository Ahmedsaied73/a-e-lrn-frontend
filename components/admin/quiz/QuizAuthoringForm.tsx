"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertQuiz, uploadQuizImage } from "@/services/adminQuizService";
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
  imageUrl: string;
  imagePreview: string | null;
  imageUploading: boolean;
  imageError: string | null;
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
    imageUrl: "",
    imagePreview: null,
    imageUploading: false,
    imageError: null,
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

function imageUploadErrorMessage(error: unknown): string {
  const status = typeof error === "object" && error !== null && "status" in error
    ? (error as { status?: unknown }).status
    : undefined;
  if (status === 413) return "الصورة كبيرة جداً — الحد الأقصى 5MB.";
  if (status === 415) return "نوع الملف غير مدعوم — استخدم JPEG أو PNG أو WebP أو GIF.";
  if (status === 501) return "رفع الصور غير مفعّل على الخادم بعد.";
  return errorMessage(error);
}

function parseChoices(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
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
    return { ...base, imageLink: question.imageUrl.trim() };
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
    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
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
      if (question.type === "image" && !question.imageUrl.trim()) {
        return `أضف صورة للعنصر ${index + 1}.`;
      }
    }
    return null;
  };

  const handleImageSelect = async (id: string, file: File | undefined) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updateQuestion(id, { imagePreview: preview, imageUploading: true, imageError: null });
    try {
      const url = await uploadQuizImage(file);
      URL.revokeObjectURL(preview);
      updateQuestion(id, { imageUrl: url, imagePreview: null, imageUploading: false, imageError: null });
    } catch (uploadError) {
      URL.revokeObjectURL(preview);
      updateQuestion(id, { imagePreview: null, imageUploading: false, imageError: imageUploadErrorMessage(uploadError) });
    }
  };

  const clearImage = (id: string) => {
    const question = questions.find((item) => item.id === id);
    if (question?.imagePreview) URL.revokeObjectURL(question.imagePreview);
    updateQuestion(id, { imageUrl: "", imagePreview: null, imageUploading: false, imageError: null });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (questions.some((question) => question.imageUploading)) {
      setError("انتظر اكتمال رفع الصور قبل الحفظ.");
      return;
    }
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
      <section className="rounded-xl border border-outline-variant/70 bg-card p-6">
        <h1 className="text-xl font-bold text-on-surface">إنشاء اختبار للفيديو {videoId}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">الحفظ يستبدل تعريف الاختبار الحالي لهذا الفيديو.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="sm:col-span-3 text-sm font-semibold text-on-surface/80">عنوان الاختبار
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
          </label>
          <label className="text-sm font-semibold text-on-surface/80">المدة بالثواني (اختياري)
            <input type="number" min="1" value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
          </label>
          <label className="text-sm font-semibold text-on-surface/80">نسبة النجاح
            <input type="number" min="0" max="100" value={passingScore} onChange={(event) => setPassingScore(event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
          </label>
        </div>
      </section>

      {questions.map((question, index) => (
        <section key={question.id} className="rounded-xl border border-outline-variant/70 bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-on-surface">العنصر {index + 1}</h2>
            <button type="button" onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))} disabled={questions.length === 1} className="text-sm font-semibold text-error transition-colors duration-150 hover:text-[#93000a] disabled:opacity-40">حذف</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-on-surface/80">النوع
              <select value={question.type} onChange={(event) => updateQuestion(question.id, { type: event.target.value as QuestionType })} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20">
                <option value="radiogroup">اختيار من متعدد</option><option value="comment">مقالي</option><option value="html">HTML للعرض</option><option value="image">صورة للعرض</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-on-surface/80">المعرف
              <input value={question.name} onChange={(event) => updateQuestion(question.id, { name: event.target.value })} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
            </label>
            <label className="sm:col-span-2 text-sm font-semibold text-on-surface/80">العنوان
              <input value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
            </label>
            {(question.type === "radiogroup" || question.type === "comment") && <label className="text-sm font-semibold text-on-surface/80">النقاط
              <input type="number" min="1" value={question.points} onChange={(event) => updateQuestion(question.id, { points: event.target.value })} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
            </label>}
            {question.type === "radiogroup" && <>
              <label className="text-sm font-semibold text-on-surface/80">الخيارات (كل سطر: value | النص)
                <textarea value={question.choicesText} onChange={(event) => updateQuestion(question.id, { choicesText: event.target.value })} className="mt-1 min-h-28 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
              </label>
              <label className="text-sm font-semibold text-on-surface/80">قيمة الإجابة الصحيحة
                <input value={question.correctValue} onChange={(event) => updateQuestion(question.id, { correctValue: event.target.value })} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
              </label>
            </>}
            {question.type === "comment" && <label className="sm:col-span-2 text-sm font-semibold text-on-surface/80">الإجابة النموذجية
              <textarea value={question.modelAnswer} onChange={(event) => updateQuestion(question.id, { modelAnswer: event.target.value })} className="mt-1 min-h-28 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
            </label>}
            {question.type === "html" && <label className="sm:col-span-2 text-sm font-semibold text-on-surface/80">محتوى العرض
              <textarea value={question.html} onChange={(event) => updateQuestion(question.id, { html: event.target.value })} className="mt-1 min-h-28 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
            </label>}
            {question.type === "image" && <div className="sm:col-span-2 text-sm font-semibold text-on-surface/80">صورة السؤال
              <div className="mt-1">
                {(question.imageUrl || question.imagePreview) && (
                  <img
                    src={question.imageUrl || question.imagePreview || ""}
                    alt="معاينة صورة السؤال"
                    className="mb-2 max-h-48 rounded-lg border border-outline-variant object-contain"
                  />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors duration-150 ${question.imageUploading ? "bg-outline cursor-wait" : "bg-[#207bff] hover:bg-[#0057c0]"}`}>
                    {question.imageUrl ? "استبدال الصورة" : "اختيار صورة من الجهاز"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={question.imageUploading}
                      onChange={(event) => {
                        void handleImageSelect(question.id, event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {(question.imageUrl || question.imageError) && (
                    <button
                      type="button"
                      onClick={() => clearImage(question.id)}
                      disabled={question.imageUploading}
                      className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors duration-150 hover:border-[#207bff] hover:text-[#0057c0] disabled:opacity-40"
                    >
                      إزالة
                    </button>
                  )}
                </div>
                {question.imageUploading && <p className="mt-1 text-xs font-semibold text-[#0057c0]">جاري رفع الصورة...</p>}
                {question.imageError && <p role="alert" className="mt-1 text-xs font-semibold text-red-700">{question.imageError}</p>}
              </div>
            </div>}
          </div>
        </section>
      ))}

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {savedQuiz && <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
        <span>تم حفظ الاختبار بنجاح.</span>
        <button type="button" onClick={() => router.push(`/admin/quizzes/quiz/${savedQuiz.id}/attempts`)} className="rounded-lg bg-[#207bff] px-3 py-2 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#0057c0]">فتح طابور التصحيح</button>
      </div>}
      <div className="flex gap-3">
        <button type="button" onClick={() => setQuestions((current) => [...current, newQuestion()])} className="rounded-lg border border-outline-variant px-4 py-2.5 font-semibold text-on-surface-variant transition-colors duration-150 hover:border-[#207bff] hover:text-[#0057c0]">إضافة عنصر</button>
        <button type="submit" disabled={isSaving} className="rounded-lg bg-[#207bff] px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#0057c0] disabled:opacity-60 disabled:cursor-not-allowed">{isSaving ? "جاري الحفظ..." : "حفظ الاختبار"}</button>
      </div>
    </form>
  );
}
