/**
 * Quiz service — services/quizService.ts
 *
 * Thin, typed wrappers over apiClient. No mock branching. No business logic.
 * All types are imported from types/quiz.ts (single source of truth).
 */

import { apiClient } from '@/lib/api-client';
import type {
  QuizMeta,
  StartQuizData,
  SubmitQuizData,
  QuizResultData,
  StudentAttemptsData,
  SaveQuizData,
} from '@/types/quiz';

/**
 * GET /quizzes/videos/:videoId/meta
 * Returns quiz metadata for a video (exists, unlocked, in-progress attempt, etc.)
 */
export async function getQuizMeta(videoId: number | string): Promise<QuizMeta> {
  return apiClient.get<QuizMeta>(`/quizzes/videos/${videoId}/meta`);
}

/**
 * POST /quizzes/videos/:videoId/start
 * Start a new attempt OR resume an in-progress one — backend handles both cases identically.
 */
export async function startQuiz(videoId: number | string): Promise<StartQuizData> {
  return apiClient.post<StartQuizData>(`/quizzes/videos/${videoId}/start`, {});
}

/**
 * POST /quizzes/attempts/:id/submit
 * Submit final answers. `answers` is the raw survey.data object from survey-core.
 */
export async function submitQuiz(
  attemptId: number,
  answers: Record<string, unknown>,
  autoSubmitted: boolean,
): Promise<SubmitQuizData> {
  return apiClient.post<SubmitQuizData>(`/quizzes/attempts/${attemptId}/submit`, {
    answers,
    autoSubmitted,
  });
}

/**
 * PATCH /quizzes/attempts/:id/save
 * Saves the current response map without grading or changing attempt status.
 */
export async function saveQuizResponses(
  attemptId: number,
  responses: Record<string, unknown>,
): Promise<SaveQuizData> {
  return apiClient.patch<SaveQuizData>(`/quizzes/attempts/${attemptId}/save`, {
    responses,
  });
}

/**
 * GET /quizzes/attempts/:id/result
 * Fetch full graded/pending result with per-question breakdown.
 */
export async function getQuizResult(attemptId: number | string): Promise<QuizResultData> {
  return apiClient.get<QuizResultData>(`/quizzes/attempts/${attemptId}/result`);
}

/**
 * GET /quizzes/videos/:videoId/attempts
 * Fetch all past attempts for a video's quiz (ordered by attemptNumber desc from API).
 */
export async function getQuizAttempts(videoId: number | string): Promise<StudentAttemptsData> {
  return apiClient.get<StudentAttemptsData>(`/quizzes/videos/${videoId}/attempts`);
}
