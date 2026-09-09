"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertQuiz, uploadQuizImage } from "@/services/adminQuizService";
import QuestionImagePicker from "./QuestionImagePicker";
import type { StudentSafeQuiz, UpsertQuizInput } from "@/types/quiz";

type QuestionType = "radiogroup" | "comment" | "html" | "image";

interface AuthorChoice {
  id: string;
  text: string;
}

interface AuthorQuestion {
  id: string;
  type: QuestionType;
  title: string;
  points: string;
  choices: AuthorChoice[];
  correctChoiceId: string;
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

function newChoice(text = ""): AuthorChoice {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text };
}

function newQuestion(): AuthorQuestion {
  const first = newChoice();
  const second = newChoice();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: "radiogroup",
    title: "",
    points: "1",
    choices: [first, second],
    correctChoiceId: first.id,
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

function buildPayload(title: string, timeLimit: string, passingScore: string, questions: AuthorQuestion[]): UpsertQuizInput {
  // Internal element names are auto-assigned (q1..qn) — the المعرف field was
  // removed from the UI; the backend requires unique names for grading keys.
  const elements = questions.map((question, index) => {
    const base = { type: question.type, name: `q${index + 1}`, title: question.title.trim() };
    if (question.type === "radiogroup") {
      // Empty rows are UI scratch space — never ship them as blank options.
      const filled = question.choices.filter((choice) => choice.text.trim());
      return {
        ...base,
        choices: filled.map((choice) => ({ value: choice.text.trim(), text: choice.text.trim() })),
        ...(question.imageUrl.trim() ? { imageLink: question.imageUrl.trim() } : {}),
      };
    }
    if (question.type === "comment") {
      return {
        ...base,
        ...(question.imageUrl.trim() ? { imageLink: question.imageUrl.trim() } : {}),
      };
    }
    if (question.type === "html") return { ...base, html: question.html };
    return { ...base, imageLink: question.imageUrl.trim() };
  });

  const answerKey: Record<string, unknown> = {};
  questions.forEach((question, index) => {
    const name = `q${index + 1}`;
    if (question.type === "radiogroup") {
      const correct = question.choices.find((choice) => choice.id === question.correctChoiceId);
      answerKey[name] = {
        type: question.type,
        correctValue: (correct?.text || "").trim(),
        points: Number(question.points),
      };
    } else if (question.type === "comment") {
      answerKey[name] = {
        type: question.type,
        modelAnswer: question.modelAnswer.trim(),
        points: Number(question.points),
      };
    }
  });

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

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      const label = `العنصر ${index + 1}`;
      if (question.type === "radiogroup") {
        const texts = question.choices.map((choice) => choice.text.trim()).filter(Boolean);
        if (texts.length < 2) return `أضف خيارين على الأقل لـ${label}.`;
        if (new Set(texts).size !== texts.length) return `نصوص الخيارات مكررة في ${label} — يجب أن يختلف كل خيار.`;
        const correct = question.choices.find((choice) => choice.id === question.correctChoiceId);
        if (!correct || !correct.text.trim()) return `حدد الإجابة الصحيحة لـ${label}.`;
      }
      if ((question.type === "radiogroup" || question.type === "comment") && Number(question.points) <= 0) {
        return `نقاط ${label} يجب أن تكون أكبر من صفر.`;
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

  const updateChoice = (questionId: string, choiceId: string, text: string) => {
    setQuestions((current) => current.map((question) => question.id === questionId
      ? { ...question, choices: question.choices.map((choice) => choice.id === choiceId ? { ...choice, text } : choice) }
      : question));
  };

  const addChoice = (questionId: string) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId) return question;
      const choice = newChoice();
      return {
        ...question,
        choices: [...question.choices, choice],
        correctChoiceId: question.correctChoiceId || choice.id,
      };
    }));
  };

  const removeChoice = (questionId: string, choiceId: string) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId || question.choices.length <= 2) return question;
      const choices = question.choices.filter((choice) => choice.id !== choiceId);
      const correctChoiceId = question.correctChoiceId === choiceId
        ? (choices[0]?.id || "")
        : question.correctChoiceId;
      return { ...question, choices, correctChoiceId };
    }));
  };

  const anyUploading = questions.some((question) => question.imageUploading);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (anyUploading) {
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
            <label className="sm:col-span-2 text-sm font-semibold text-on-surface/80">العنوان
              <input value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
            </label>
            {(question.type === "radiogroup" || question.type === "comment") && <label className="text-sm font-semibold text-on-surface/80">النقاط
              <input type="number" min="1" value={question.points} onChange={(event) => updateQuestion(question.id, { points: event.target.value })} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
            </label>}
            {question.type === "radiogroup" && <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-on-surface/80">الخيارات <span className="font-normal text-on-surface-variant">— حدد الإجابة الصحيحة بالزر</span></p>
              <div className="mt-1 space-y-2">
                {question.choices.map((choice) => (
                  <div key={choice.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={question.correctChoiceId === choice.id}
                      onChange={() => updateQuestion(question.id, { correctChoiceId: choice.id })}
                      title="إجابة صحيحة"
                      aria-label="إجابة صحيحة"
                      className="h-4 w-4 shrink-0 accent-[#207bff]"
                    />
                    <input
                      value={choice.text}
                      onChange={(event) => updateChoice(question.id, choice.id, event.target.value)}
                      placeholder="نص الخيار"
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeChoice(question.id, choice.id)}
                      disabled={question.choices.length <= 2}
                      title="حذف الخيار"
                      aria-label="حذف الخيار"
                      className="shrink-0 rounded-lg border border-outline-variant px-2.5 py-2 text-sm font-bold text-error transition-colors duration-150 hover:border-error disabled:opacity-40"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addChoice(question.id)}
                className="mt-2 rounded-lg border border-dashed border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors duration-150 hover:border-[#207bff] hover:text-[#0057c0]"
              >
                ＋ إضافة خيار
              </button>
              <div className="mt-3">
                <QuestionImagePicker
                  optional
                  imageUrl={question.imageUrl}
                  imagePreview={question.imagePreview}
                  imageUploading={question.imageUploading}
                  imageError={question.imageError}
                  onSelect={(file) => void handleImageSelect(question.id, file)}
                  onClear={() => clearImage(question.id)}
                />
              </div>
            </div>}
            {question.type === "comment" && <div className="sm:col-span-2 space-y-3">
              <label className="block text-sm font-semibold text-on-surface/80">الإجابة النموذجية
                <textarea value={question.modelAnswer} onChange={(event) => updateQuestion(question.id, { modelAnswer: event.target.value })} className="mt-1 min-h-28 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
              </label>
              <QuestionImagePicker
                optional
                imageUrl={question.imageUrl}
                imagePreview={question.imagePreview}
                imageUploading={question.imageUploading}
                imageError={question.imageError}
                onSelect={(file) => void handleImageSelect(question.id, file)}
                onClear={() => clearImage(question.id)}
              />
            </div>}
            {question.type === "html" && <label className="sm:col-span-2 text-sm font-semibold text-on-surface/80">محتوى العرض
              <textarea value={question.html} onChange={(event) => updateQuestion(question.id, { html: event.target.value })} className="mt-1 min-h-28 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20" />
            </label>}
            {question.type === "image" && <div className="sm:col-span-2">
              <QuestionImagePicker
                imageUrl={question.imageUrl}
                imagePreview={question.imagePreview}
                imageUploading={question.imageUploading}
                imageError={question.imageError}
                onSelect={(file) => void handleImageSelect(question.id, file)}
                onClear={() => clearImage(question.id)}
              />
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
        <button type="submit" disabled={isSaving || anyUploading} className="rounded-lg bg-[#207bff] px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#0057c0] disabled:opacity-60 disabled:cursor-not-allowed">{isSaving ? "جاري الحفظ..." : "حفظ الاختبار"}</button>
      </div>
    </form>
  );
}
