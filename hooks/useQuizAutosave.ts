import { useCallback, useEffect, useRef, useState } from "react";
import { saveQuizResponses } from "@/services/quizService";

interface UseQuizAutosaveOptions {
  attemptId: number;
  responses: Record<string, unknown>;
  enabled: boolean;
  debounceMs?: number;
}

interface UseQuizAutosaveResult {
  isSaving: boolean;
  saveError: string | null;
  saveNow: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "تعذر حفظ إجاباتك مؤقتاً.";
}

export function useQuizAutosave({
  attemptId,
  responses,
  enabled,
  debounceMs = 25000,
}: UseQuizAutosaveOptions): UseQuizAutosaveResult {
  const responsesRef = useRef(responses);
  const saveInFlightRef = useRef<Promise<void> | null>(null);
  // F-1: edits made mid-save queue ONE trailing save instead of waiting for
  // the next 25s tick (which a crash would silently eat).
  const pendingRef = useRef(false);
  const enabledRef = useRef(enabled);
  const firstRenderRef = useRef(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    responsesRef.current = responses;
    enabledRef.current = enabled;
  }, [responses, enabled]);

  const saveNow = useCallback(async () => {
    if (!enabledRef.current) return;
    if (saveInFlightRef.current) {
      pendingRef.current = true;
      return saveInFlightRef.current;
    }

    const savePromise = (async () => {
      setIsSaving(true);
      setSaveError(null);
      try {
        await saveQuizResponses(attemptId, responsesRef.current);
      } catch (error: unknown) {
        setSaveError(getErrorMessage(error));
      } finally {
        setIsSaving(false);
        saveInFlightRef.current = null;
        // Flush one trailing save with the newest state (single level — the
        // recursive call re-arms pendingRef if edits land during the flush).
        if (pendingRef.current) {
          pendingRef.current = false;
          void saveNow();
        }
      }
    })();

    saveInFlightRef.current = savePromise;
    return savePromise;
  }, [attemptId]);

  useEffect(() => {
    if (!enabled) return;
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveNow();
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [responses, enabled, debounceMs, saveNow]);

  useEffect(() => {
    if (!enabled) return;

    const flush = () => {
      if (document.visibilityState === "hidden" || document.visibilityState === undefined) {
        void saveNow();
      }
    };

    document.addEventListener("visibilitychange", flush);
    window.addEventListener("blur", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("blur", flush);
    };
  }, [enabled, saveNow]);

  return { isSaving, saveError, saveNow };
}
