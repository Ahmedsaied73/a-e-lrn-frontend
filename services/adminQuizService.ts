import { apiClient } from "@/lib/api-client";
import type {
  AdminQuizAttempt,
  GradeAttemptInput,
  QuizResultData,
  StudentSafeQuiz,
  UpsertQuizInput,
} from "@/types/quiz";

export async function upsertQuiz(
  videoId: number | string,
  input: UpsertQuizInput,
): Promise<StudentSafeQuiz> {
  return apiClient.post<StudentSafeQuiz>(`/quizzes/videos/${videoId}`, input);
}

export async function listQuizAttempts(
  quizId: number | string,
  status = "GRADING",
): Promise<AdminQuizAttempt[]> {
  return apiClient.get<AdminQuizAttempt[]>(
    `/quizzes/${quizId}/attempts?status=${encodeURIComponent(status)}`,
  );
}

export async function getAdminAttemptResult(attemptId: number | string): Promise<QuizResultData> {
  return apiClient.get<QuizResultData>(`/quizzes/attempts/${attemptId}/result`);
}

export async function gradeQuizAttempt(
  attemptId: number | string,
  input: GradeAttemptInput,
): Promise<AdminQuizAttempt> {
  return apiClient.put<AdminQuizAttempt>(`/quizzes/attempts/${attemptId}/grade`, input);
}

export async function resetQuizAttempt(attemptId: number | string): Promise<void> {
  await apiClient.post(`/quizzes/attempts/${attemptId}/reset`, {});
}

export async function grantQuizExemption(
  videoId: number | string,
  userId: number,
  reason?: string,
): Promise<{ id: number }> {
  return apiClient.post<{ id: number }>(`/quizzes/videos/${videoId}/exemptions`, {
    userId,
    reason,
  });
}

export async function revokeQuizExemption(exemptionId: number | string): Promise<void> {
  await apiClient.delete(`/quizzes/exemptions/${exemptionId}`);
}
