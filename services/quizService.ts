/**
 * Quiz Service — services/quizService.ts
 *
 * Single source of truth for all quiz and video-progress API calls.
 * Uses apiClient from lib/api-client.ts (in-memory token, envelope parsing).
 *
 * Endpoint changes vs. old code:
 *  - POST /progress/complete { videoId }  →  POST /progress/mark { videoId, completed: true }
 */

import { apiClient } from '@/lib/api-client';
import {
  getMockQuizResult,
  getMockQuizStatus,
  getMockVideoProgress,
  isMockCourse,
  isMockQuizId,
  isMockVideoId,
  mockQuizDetails,
  mockQuizzes,
} from '@/lib/mock/course';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[] | { id: number; text: string }[];
  points: number;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  isFinal: boolean;
  passingScore: number;
  videoId: number | null;
  videoTitle: string | null;
  questionCount: number;
  createdAt: string;
  status?: {
    taken: boolean;
    score: number | null;
    passed: boolean | null;
    submittedAt: string | null;
  };
  questions?: QuizQuestion[];
}

export interface QuizResult {
  quizId: number;
  title: string;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  passingScore: number;
  passed: boolean;
  submittedAt: string;
  results: {
    questionId: number;
    questionText: string;
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    points: number;
    explanation: string;
  }[];
}

export interface QuizStatus {
  quizId: number;
  title: string;
  taken: boolean;
  status: 'PASSED' | 'FAILED' | null;
  score: number | null;
  passingScore: number;
  passed: boolean;
  submittedAt: string | null;
  correctAnswers?: number;
  totalQuestions?: number;
}

export interface VideoProgress {
  videoId: number | string;
  completed: boolean;
  watchedAt: string | null;
}

// ---------------------------------------------------------------------------
// Helper — resilient unwrap (flat OR {success,data} envelope)
// ---------------------------------------------------------------------------
function unwrap<T>(raw: unknown): T {
  if (raw !== null && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if ('success' in obj && 'data' in obj) {
      return obj.data as T;
    }
  }
  return raw as T;
}

// ---------------------------------------------------------------------------
// Quiz API calls
// ---------------------------------------------------------------------------

/**
 * GET /quizzes/course/:courseId
 * Returns a list of quizzes for a course.
 */
export async function fetchQuizzesByCourse(courseId: string | number): Promise<Quiz[]> {
  if (isMockCourse(courseId)) return mockQuizzes;
  const raw = await apiClient.get<unknown>(`/quizzes/course/${courseId}`);
  const data = unwrap<Quiz[] | { quizzes?: Quiz[] }>(raw);
  if (Array.isArray(data)) return data;
  if (data && 'quizzes' in data && Array.isArray(data.quizzes)) return data.quizzes;
  return [];
}

/**
 * GET /quizzes/:quizId
 * Returns a single quiz with its questions.
 */
export async function fetchQuizById(quizId: number): Promise<Quiz> {
  if (isMockQuizId(quizId)) return mockQuizDetails[quizId];
  const raw = await apiClient.get<unknown>(`/quizzes/${quizId}`);
  return unwrap<Quiz>(raw);
}

/**
 * POST /quizzes/submit
 * Submit answers and receive graded result.
 */
export async function submitQuizAnswers(
  quizId: number,
  answers: { questionId: number; selectedOption: number }[],
): Promise<QuizResult> {
  if (isMockQuizId(quizId)) return getMockQuizResult(quizId);
  const raw = await apiClient.post<unknown>('/quizzes/submit', { quizId, answers });
  return unwrap<QuizResult>(raw);
}

/**
 * GET /quizzes/:quizId/results
 * Fetch the result of a previously taken quiz.
 */
export async function fetchQuizResults(quizId: number): Promise<QuizResult> {
  if (isMockQuizId(quizId)) return getMockQuizResult(quizId);
  const raw = await apiClient.get<unknown>(`/quizzes/${quizId}/results`);
  return unwrap<QuizResult>(raw);
}

/**
 * GET /quizzes/:quizId/status
 * Check whether the current user has taken a quiz.
 */
export async function fetchQuizStatus(quizId: number): Promise<QuizStatus> {
  if (isMockQuizId(quizId)) return getMockQuizStatus(quizId);
  const raw = await apiClient.get<unknown>(`/quizzes/${quizId}/status`);
  return unwrap<QuizStatus>(raw);
}

// ---------------------------------------------------------------------------
// Video Progress API calls
// ---------------------------------------------------------------------------

/**
 * GET /progress/:videoId
 * Retrieve the authenticated user's watch progress for a video.
 */
export async function fetchVideoProgress(videoId: string | number): Promise<VideoProgress> {
  if (isMockVideoId(videoId)) return getMockVideoProgress(videoId);
  const raw = await apiClient.get<unknown>(`/progress/${videoId}`);
  return unwrap<VideoProgress>(raw);
}

/**
 * POST /progress/mark { videoId, completed: true }
 * Mark a video as completed.
 * (Previously: POST /progress/complete { videoId })
 */
export async function markVideoComplete(videoId: string | number): Promise<VideoProgress> {
  const numericId = Number(videoId);
  if (isMockVideoId(numericId)) {
    return { videoId: numericId, completed: true, watchedAt: new Date().toISOString() };
  }
  const raw = await apiClient.post<unknown>('/progress/mark', {
    videoId: numericId,
    completed: true,
  });
  return unwrap<VideoProgress>(raw);
}
