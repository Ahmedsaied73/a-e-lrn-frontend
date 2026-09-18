"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { submitQuizAttempt, fetchQuizMeta, fetchQuizResult } from "@/store/slices/quizSlice";
import { API_BASE_URL } from "@/lib/api-client";
import { useQuizTimer } from "@/hooks/useQuizTimer";
import { useQuizAutosave } from "@/hooks/useQuizAutosave";
import { ApiError } from "@/lib/errors";
import type { StartQuizData } from "@/types/quiz";
import { Flag, Loader2, AlertTriangle } from "lucide-react";
import DOMPurify from 'dompurify';

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
function sanitizeQuizHtml(html: string, allowDomParser: boolean): string {
  if (!allowDomParser || typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
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
  courseSlug: string;
  videoSlug: string;
}

export default function QuizRunner({ startData, courseSlug, videoSlug }: QuizRunnerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const questions = extractQuestions(startData.quiz.surveyJson);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => startData.responses ?? {});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const submitLockRef = useRef(false);
  // Auto-submit-on-leave refs
  const leaveSubmittedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());
  const answersRef = useRef<Record<string, unknown>>(answers);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Keep a live ref of the latest answers for the keepalive leave-submit.
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const { isSaving, saveError } = useQuizAutosave({
    attemptId: startData.attemptId,
    responses: answers,
    enabled: startData.status === "IN_PROGRESS" && !isSubmitting,
  });

  useEffect(() => {
    if (!startData.resumed) return;
    setAnswers(startData.responses ?? {});
  }, [startData.attemptId, startData.resumed, startData.responses]);

  /**
   * Best-effort submit while the page is going away (navigation/unload).
   * Uses fetch with `keepalive` (Fired during beforeunload/pagehide).
   * No redirect, no UI — the result page fetch handles the aftermath.
   * The server's stale-finalize backstop catches any attempt that never
   * reaches the server here.
   */
  const fireKeepaliveSubmit = useCallback(() => {
    if (startData.status !== "IN_PROGRESS") return;
    if (leaveSubmittedRef.current) return;
    if (Date.now() - mountedAtRef.current < 2000) return; // StrictMode remount guard
    leaveSubmittedRef.current = true;
    try {
      const payload = JSON.stringify({ answers: answersRef.current, autoSubmitted: true });
      fetch(`${API_BASE_URL}/quizzes/attempts/${startData.attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        credentials: "include",
        keepalive: true,
      }).catch(() => {
        // Best-effort — the stale-finalize backstop will handle it
      });
    } catch {
      // ignore
    }
  }, [startData.status, startData.attemptId]);

  // Auto-submit on leave: full-page unload (beforeunload/pagehide) AND
  // in-app route unmount. Replaces the old "are you sure?" warning blocker,
  // which was what left exams stuck in IN_PROGRESS forever.
  useEffect(() => {
    if (startData.status !== "IN_PROGRESS") return;

    const handleUnload = () => fireKeepaliveSubmit();
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      fireKeepaliveSubmit();
    };
  }, [startData.status, fireKeepaliveSubmit]);

  // Prevent double submission
  const doSubmit = useCallback(async (auto: boolean) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    // A manual/timer submit means the exam is being handed in — the later
    // route-unmount must not fire a redundant keepalive submit.
    leaveSubmittedRef.current = true;
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
        await dispatch(fetchQuizMeta(videoSlug)).unwrap();
        router.push(`/course/${courseSlug}/video/${videoSlug}/quiz/result/${startData.attemptId}`);
      }
    } catch (err: unknown) {
      // 403 (deadline passed) or 409 (already graded) → fetch result and show it
      const status = getErrorStatus(err);
      if (status === 403 || status === 409) {
        try {
          await dispatch(fetchQuizResult(startData.attemptId)).unwrap();
          router.push(`/course/${courseSlug}/video/${videoSlug}/quiz/result/${startData.attemptId}`);
          return;
        } catch (recoveryError: unknown) {
          setSubmitError(getErrorMessage(recoveryError, "تعذر تحميل حالة محاولة الاختبار."));
          submitLockRef.current = false;
          leaveSubmittedRef.current = false;
          return;
        }
      }
      setSubmitError(getErrorMessage(err, "تعذر تسليم الاختبار، يرجى المحاولة مرة أخرى."));
      submitLockRef.current = false;
      leaveSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, startData.attemptId, dispatch, router, courseSlug, videoSlug]);

  const handleAutoSubmit = useCallback(() => {
    void doSubmit(true);
  }, [doSubmit]);

  const { remainingSec } = useQuizTimer(isSubmitting ? null : startData.deadlineAt, handleAutoSubmit);

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
      return "flex h-9 w-9 items-center justify-center rounded-lg bg-brand-ink text-sm font-bold text-white transition";
    }
    if (isFlagged) {
      return "flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400 text-sm font-bold text-amber-700 transition hover:bg-amber-50";
    }
    if (answered) {
      return "flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/15 text-sm font-bold text-brand-primary transition";
    }
    return "flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-sm font-bold text-brand-muted transition hover:border-brand-primary/40";
  }

  // Render per-question UI
  function renderQuestion(q: SurveyElement) {
    // Optional photo attached to an answerable question (MCQ/essay) —
    // same guard as standalone image elements.
    const attachedImage = typeof q.imageLink === "string" && isSafeHtmlUrl(q.imageLink)
      ? q.imageLink
      : null;
    const attachedImageNode = attachedImage ? (
      // eslint-disable-next-line @next/next/no-img-element -- images are admin-pasted from unbounded external hosts; next/image requires per-host remotePatterns and a wildcard would reopen the SSRF hole (see next.config.js)
      <img src={attachedImage} alt={q.title ?? "صورة السؤال"} className="mx-auto mb-4 max-h-96 rounded-xl object-contain" />
    ) : null;

    if (q.type === "radiogroup") {
      const choices = (q.choices ?? []) as Array<string | { value: string; text: string }>;
      const selected = answers[q.name] as string | undefined;

      return (
        <>
          {attachedImageNode}
          <div className="mt-6 space-y-2.5">
            {choices.map((choice, ci) => {
              const val = getChoiceValue(choice);
              const txt = getChoiceText(choice);
              const isSelected = selected === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAnswer(q.name, val)}
                  className={
                    "flex w-full items-center gap-3 rounded-xl border-s-4 bg-brand-surface px-4 py-3.5 text-start text-sm transition " +
                    (isSelected
                      ? "border-s-brand-primary bg-brand-primary/5 font-semibold text-brand-primary"
                      : "border-s-transparent text-brand-muted-strong hover:bg-brand-bg")
                  }
                >
                  <span className={"font-mono text-xs " + (isSelected ? "text-brand-primary" : "text-brand-muted")}>
                    {String.fromCharCode(65 + ci)}
                  </span>
                  {txt}
                </button>
              );
            })}
          </div>
        </>
      );
    }

    if (q.type === "comment") {
      return (
        <>
          {attachedImageNode}
          <textarea
            className="mt-6 min-h-[160px] w-full resize-y rounded-xl border border-brand-border bg-brand-bg p-4 text-sm font-medium text-brand-text placeholder:text-brand-muted transition focus:border-brand-primary focus:outline-none"
            placeholder="اكتب إجابتك هنا..."
            value={(answers[q.name] as string) ?? ""}
            onChange={(e) => setAnswer(q.name, e.target.value)}
            dir="rtl"
          />
        </>
      );
    }

    if (q.type === "html") {
      return (
        <div
          className="prose max-w-none text-brand-muted-strong"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sanitizeQuizHtml(q.html ?? "", isHydrated)) }}
        />
      );
    }

    if (q.type === "image") {
      const imageLink = typeof q.imageLink === "string" && isSafeHtmlUrl(q.imageLink)
        ? q.imageLink
        : null;
      return imageLink ? (
        // eslint-disable-next-line @next/next/no-img-element -- see attachedImageNode above
        <img src={imageLink} alt={q.title ?? "صورة السؤال"} className="mx-auto max-h-96 rounded-xl object-contain" />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
          تعذر عرض صورة السؤال.
        </div>
      );
    }

    // image or unknown types — static display
    return (
      <div className="rounded-xl border border-brand-border bg-brand-bg p-6 text-center text-sm text-brand-muted">
        عنصر عرض — {q.type}
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="flex h-64 items-center justify-center bg-brand-bg">
        <p className="text-brand-muted">لا توجد أسئلة في هذا الاختبار.</p>
      </div>
    );
  }

  const answeredCount = questions.filter((_, idx) => isAnswered(idx)).length;
  const isCurrentFlagged = flagged.has(currentIndex);

  return (
    <div dir="rtl" className="min-h-dvh bg-brand-bg">
      <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-sm font-bold text-brand-text">{startData.quiz.title}</p>
          <div className="flex items-center gap-4">
            {startData.status === "IN_PROGRESS" && (
              <span className="hidden text-xs text-brand-muted sm:inline">
                {isSaving ? "جاري حفظ الإجابات..." : "يتم حفظ الإجابات تلقائياً"}
              </span>
            )}
            {remainingSec !== null && (
              <span className={"font-mono text-sm font-bold text-brand-accent" + (timerUrgent ? " animate-pulse" : "")}>
                {formatTimer(remainingSec)}
              </span>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting}
              className="rounded-full border border-brand-accent/40 px-4 py-1.5 text-xs font-bold text-brand-accent transition hover:bg-brand-accent/10 disabled:opacity-60"
            >
              {isSubmitting ? "جاري التسليم..." : "تسليم الاختبار"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {submitError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-brand-accent">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{submitError}</p>
          </div>
        )}

        {saveError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{saveError} سيُعاد الحفظ تلقائياً عند تعديل الإجابات.</p>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.name}
              type="button"
              onClick={() => setCurrentIndex(i)}
              title={flagged.has(i) ? "محدد للمراجعة" : undefined}
              className={navBtnClass(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="mb-4 text-xs text-brand-muted">
          تمت الإجابة على {answeredCount} من {totalQ}
        </p>

        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-brand-primary">السؤال {currentIndex + 1}</p>
            <button
              type="button"
              onClick={() => toggleFlag(currentIndex)}
              className={
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition " +
                (isCurrentFlagged
                  ? "bg-amber-100 text-amber-700"
                  : "text-brand-muted hover:bg-brand-bg hover:text-amber-700")
              }
            >
              <Flag className="h-3.5 w-3.5" />
              {isCurrentFlagged ? "محدد للمراجعة" : "تحديد للمراجعة"}
            </button>
          </div>
          {currentQ.title && (
            <h2 className="mt-2 text-lg font-bold leading-relaxed text-brand-text">{currentQ.title}</h2>
          )}

          {renderQuestion(currentQ)}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
            disabled={currentIndex === 0}
            className="text-sm font-semibold text-brand-muted transition hover:text-brand-primary disabled:opacity-30"
          >
            ← السابق
          </button>
          {currentIndex < totalQ - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((c) => Math.min(totalQ - 1, c + 1))}
              className="rounded-full bg-brand-ink px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-ink/90"
            >
              السؤال التالي →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="rounded-full bg-brand-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90"
            >
              إنهاء وتسليم
            </button>
          )}
        </div>
      </main>

      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-brand-surface p-6 text-center">
            <p className="text-base font-bold text-brand-text">تسليم الاختبار؟</p>
            <p className="mt-2 text-sm text-brand-muted">
              أجبت على {answeredCount} من {totalQ} سؤال. لن تتمكن من التعديل بعد التسليم.
            </p>
            {flagged.size > 0 && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                لديك {flagged.size} سؤال محدد للمراجعة — بعد التسليم لا يمكن التراجع.
              </p>
            )}
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-full border border-brand-border py-2.5 text-sm font-semibold text-brand-muted-strong hover:bg-brand-hover"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => { setShowConfirm(false); void doSubmit(false); }}
                className="flex-1 rounded-full bg-brand-primary py-2.5 text-sm font-bold text-white hover:bg-brand-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "تسليم"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
