"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store/store";
import { submitQuizAttempt, fetchQuizResult, selectActiveAttempt, selectSubmitResult } from "@/store/slices/quizSlice";
import { useQuizTimer } from "@/hooks/useQuizTimer";
import { ApiError } from "@/lib/errors";
import type { StartQuizData } from "@/types/quiz";
import { Flag, ChevronRight, ChevronLeft, CheckCircle, Clock, Loader2, AlertTriangle } from "lucide-react";

// --- Types from SurveyJS surveyJson shape ---
interface SurveyElement {
  name: string;
  type: string;
  title?: string;
  html?: string;
  choices?: Array<string | { value: string; text: string }>;
  [key: string]: unknown;
}

interface SurveyPage {
  name?: string;
  elements?: SurveyElement[];
}

interface SurveyJson {
  pages?: SurveyPage[];
  elements?: SurveyElement[];
  [key: string]: unknown;
}

// Flatten all elements from a surveyJson (pages or top-level elements)
function extractQuestions(surveyJson: Record<string, unknown>): SurveyElement[] {
  const json = surveyJson as SurveyJson;
  if (json.pages && Array.isArray(json.pages)) {
    return json.pages.flatMap((p) => p.elements ?? []);
  }
  if (json.elements && Array.isArray(json.elements)) {
    return json.elements as SurveyElement[];
  }
  return [];
}

function getChoiceText(choice: string | { value: string; text: string }): string {
  return typeof choice === "string" ? choice : choice.text;
}

function getChoiceValue(choice: string | { value: string; text: string }): string {
  return typeof choice === "string" ? choice : choice.value;
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Arabic letter labels for radio choices */
const ARABIC_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز"];

const SAFE_HTML_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3",
  "h4", "h5", "h6", "i", "img", "li", "ol", "p", "pre", "span", "strong",
  "table", "tbody", "td", "th", "thead", "tr", "ul",
]);
const SAFE_HTML_ATTRIBUTES = new Set(["alt", "colspan", "height", "href", "rowspan", "src", "title", "width"]);

function isSafeHtmlUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return !normalized.startsWith("javascript:") &&
    !normalized.startsWith("vbscript:") &&
    !normalized.startsWith("data:");
}

/** Keep authored display HTML useful while preventing script and event-handler injection. */
function sanitizeQuizHtml(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html.replace(/[&<>\"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '\"': "&quot;",
      "'": "&#39;",
    }[character] ?? character));
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  const sanitizeChildren = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      const tagName = child.tagName.toLowerCase();
      if (!SAFE_HTML_TAGS.has(tagName)) {
        child.replaceWith(document.createTextNode(child.textContent ?? ""));
        continue;
      }

      for (const attribute of Array.from(child.attributes)) {
        const name = attribute.name.toLowerCase();
        if (!SAFE_HTML_ATTRIBUTES.has(name) ||
            ((name === "href" || name === "src") && !isSafeHtmlUrl(attribute.value))) {
          child.removeAttribute(attribute.name);
        }
      }

      if (tagName === "a") {
        child.removeAttribute("target");
        child.setAttribute("rel", "noreferrer noopener");
      }
      sanitizeChildren(child);
    }
  };

  sanitizeChildren(document.body);
  return document.body.innerHTML;
}

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

interface QuizRunnerProps {
  startData: StartQuizData;
  courseId: string;
  videoId: string;
}

export default function QuizRunner({ startData, courseId, videoId }: QuizRunnerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const questions = extractQuestions(startData.quiz.surveyJson);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const submitLockRef = useRef(false);

  // Prevent double submission
  const doSubmit = useCallback(async (auto: boolean) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await dispatch(
        submitQuizAttempt({
          attemptId: startData.attemptId,
          answers: answers as Record<string, unknown>,
          autoSubmitted: auto,
        })
      ).unwrap();

      // Route based on grading status
      if (result.status === "GRADED" || result.status === "GRADING") {
        router.push(`/course/${courseId}/video/${videoId}/quiz/result/${startData.attemptId}`);
      }
    } catch (err: unknown) {
      // 403 (deadline passed) or 409 (already graded) → fetch result and show it
      const status = getErrorStatus(err);
      if (status === 403 || status === 409) {
        try {
          await dispatch(fetchQuizResult(startData.attemptId)).unwrap();
          router.push(`/course/${courseId}/video/${videoId}/quiz/result/${startData.attemptId}`);
          return;
        } catch (recoveryError: unknown) {
          setSubmitError(getErrorMessage(recoveryError, "تعذر تحميل حالة محاولة الاختبار."));
          submitLockRef.current = false;
          return;
        }
      }
      setSubmitError(getErrorMessage(err, "تعذر تسليم الاختبار، يرجى المحاولة مرة أخرى."));
      submitLockRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, startData.attemptId, dispatch, router, courseId, videoId]);

  const handleAutoSubmit = useCallback(() => {
    void doSubmit(true);
  }, [doSubmit]);

  const { remainingSec } = useQuizTimer(startData.deadlineAt, handleAutoSubmit);

  const timerUrgent = remainingSec !== null && remainingSec < 300;

  // Current question
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;

  const setAnswer = (name: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFlag = (idx: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!q) return false;
    const v = answers[q.name];
    return v !== undefined && v !== null && v !== "";
  };

  // Question navigator button state
  function navBtnClass(idx: number): string {
    const isActive = idx === currentIndex;
    const answered = isAnswered(idx);
    const isFlagged = flagged.has(idx);

    if (isActive) {
      return "flex-shrink-0 w-9 h-9 rounded-lg bg-[#207bff] text-white font-bold text-xs shadow-sm ring-2 ring-[#207bff]/30 ring-offset-1 flex items-center justify-center transition";
    }
    if (isFlagged) {
      return "flex-shrink-0 w-9 h-9 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 font-semibold text-xs hover:bg-amber-100 flex items-center justify-center transition relative";
    }
    if (answered) {
      return "flex-shrink-0 w-9 h-9 rounded-lg bg-[#eef6ff] border border-[#207bff]/30 text-[#207bff] font-semibold text-xs hover:bg-blue-100 flex items-center justify-center transition relative";
    }
    return "flex-shrink-0 w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 flex items-center justify-center";
  }

  // Render per-question UI
  function renderQuestion(q: SurveyElement) {
    const qIdx = questions.indexOf(q);

    if (q.type === "radiogroup") {
      const choices = (q.choices ?? []) as Array<string | { value: string; text: string }>;
      const selected = answers[q.name] as string | undefined;

      return (
        <fieldset className="space-y-3.5">
          <legend className="sr-only">خيارات الإجابة</legend>
          {choices.map((choice, ci) => {
            const val = getChoiceValue(choice);
            const txt = getChoiceText(choice);
            const isSelected = selected === val;
            return (
              <label
                key={val}
                className={`group relative flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "border-[#207bff] bg-[#eef6ff]/50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? "bg-[#207bff] text-white"
                        : "bg-slate-100 group-hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {ARABIC_LETTERS[ci] ?? (ci + 1)}
                  </span>
                  <span className={`text-sm sm:text-base font-medium ${isSelected ? "font-semibold text-slate-900" : "text-slate-800"}`}>
                    {txt}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 bg-white transition ${
                    isSelected ? "border-[#207bff]" : "border-slate-300 group-hover:border-slate-400"
                  }`}
                >
                  {isSelected && <div className="w-3 h-3 rounded-full bg-[#207bff]" />}
                </div>
                <input
                  className="sr-only"
                  type="radio"
                  name={`q-${q.name}`}
                  value={val}
                  checked={isSelected}
                  onChange={() => setAnswer(q.name, val)}
                />
              </label>
            );
          })}
        </fieldset>
      );
    }

    if (q.type === "comment") {
      return (
        <textarea
          className="w-full min-h-[160px] p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#207bff]/30 focus:border-[#207bff] transition resize-y"
          placeholder="اكتب إجابتك هنا..."
          value={(answers[q.name] as string) ?? ""}
          onChange={(e) => setAnswer(q.name, e.target.value)}
          dir="rtl"
        />
      );
    }

    if (q.type === "html") {
      return (
        <div
          className="prose prose-slate max-w-none text-slate-700"
          dangerouslySetInnerHTML={{ __html: sanitizeQuizHtml(q.html ?? "") }}
        />
      );
    }

    // image or unknown types — static display
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
        عنصر عرض — {q.type}
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">لا توجد أسئلة في هذا الاختبار.</p>
      </div>
    );
  }

  const isCurrentAnswered = isAnswered(currentIndex);
  const isCurrentFlagged = flagged.has(currentIndex);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 flex flex-col">
      {/* ─── Sticky Top Header ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Quiz title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eef6ff] border border-blue-100 flex items-center justify-center text-[#207bff]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {startData.quiz.title}
            </h1>
          </div>

          {/* Timer + Submit */}
          <div className="flex items-center gap-3">
            {/* Timer */}
            {remainingSec !== null && (
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono text-sm font-bold transition ${
                timerUrgent
                  ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}>
                <Clock className={`w-4 h-4 ${timerUrgent ? "text-rose-500" : "text-[#207bff]"}`} />
                <span className="text-xs text-slate-500 font-sans hidden sm:inline">الوقت المتبقي:</span>
                <span>{formatTimer(remainingSec)}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting}
              className="bg-[#207bff] hover:bg-[#1a66d9] active:bg-[#1451b2] text-white font-bold text-sm px-5 py-2 rounded-lg transition-all shadow-sm shadow-blue-500/30 flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>جاري التسليم...</span></>
              ) : (
                <><span>تسليم الامتحان</span><CheckCircle className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Question Navigator Strip ─── */}
      <section className="bg-white border-b border-slate-200/90 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden md:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#207bff]" />
              قائمة الأسئلة ({totalQ} سؤال):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full py-1" style={{ scrollbarWidth: "none" }}>
              {questions.map((q, idx) => (
                <button
                  key={q.name}
                  onClick={() => setCurrentIndex(idx)}
                  className={navBtnClass(idx)}
                  title={flagged.has(idx) ? "محدد للمراجعة" : undefined}
                >
                  {idx + 1}
                  {flagged.has(idx) && idx !== currentIndex && (
                    <span className="absolute top-1 left-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  )}
                  {isAnswered(idx) && !flagged.has(idx) && idx !== currentIndex && (
                    <span className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#207bff] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Question Area ─── */}
      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {submitError && (
            <div className="mb-4 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{submitError}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            {/* Question header */}
            <div className="flex flex-wrap items-center justify-between pb-5 mb-6 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#eef6ff] text-[#207bff] font-bold text-sm">
                  {currentIndex + 1}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  السؤال {currentIndex + 1}{" "}
                  <span className="text-sm font-normal text-slate-500">(من {totalQ})</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  {currentQ.type === "radiogroup" ? "اختيار من متعدد" : currentQ.type === "comment" ? "سؤال مقالي" : "عرض"}
                </span>
                {isCurrentAnswered && !isCurrentFlagged && (
                  <span className="text-xs bg-[#eef6ff] text-[#207bff] px-3 py-1 rounded-full font-semibold border border-blue-100">
                    تمت الإجابة
                  </span>
                )}
                {isCurrentFlagged && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-200">
                    محدد للمراجعة
                  </span>
                )}
              </div>
            </div>

            {/* Question title */}
            {currentQ.title && (
              <div className="mb-6">
                <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
                  {currentQ.title}
                </p>
              </div>
            )}

            {/* Question body */}
            {renderQuestion(currentQ)}
          </div>
        </div>
      </main>

      {/* ─── Bottom Navigation Bar ─── */}
      <footer className="bg-white border-t border-slate-200 sticky bottom-0 z-30 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          {/* Previous */}
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          {/* Flag */}
          <button
            onClick={() => toggleFlag(currentIndex)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              isCurrentFlagged
                ? "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                : "text-slate-600 hover:text-amber-600 hover:bg-amber-50"
            }`}
          >
            <Flag className={`w-4 h-4 ${isCurrentFlagged ? "text-amber-500 fill-amber-400" : "text-amber-500"}`} />
            <span>{isCurrentFlagged ? "إلغاء التحديد" : "تحديد للمراجعة لاحقاً"}</span>
          </button>

          {/* Next */}
          {currentIndex < totalQ - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(totalQ - 1, i + 1))}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#207bff] hover:bg-[#1a66d9] text-white font-bold text-sm transition shadow-sm shadow-blue-500/30"
            >
              <span>السؤال التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm"
            >
              <span>مراجعة وتسليم</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>

      {/* ─── Submit Confirmation Dialog ─── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center" dir="rtl">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-[#207bff] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#207bff]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">تأكيد تسليم الاختبار</h2>
            <p className="text-slate-500 text-sm mb-2">
              أجبت على {Object.keys(answers).length} من {totalQ} سؤال.
            </p>
            {flagged.size > 0 && (
              <p className="text-amber-600 text-xs mb-4 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                لديك {flagged.size} سؤال محدد للمراجعة — بعد التسليم لا يمكن التراجع.
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowConfirm(false); void doSubmit(false); }}
                className="flex-1 py-3 rounded-xl bg-[#207bff] hover:bg-[#1a66d9] text-white font-bold transition"
              >
                تسليم الآن
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                متابعة الحل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
