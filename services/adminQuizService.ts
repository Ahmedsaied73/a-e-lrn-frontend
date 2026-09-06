import { apiClient } from "@/lib/api-client";
import type {
  AdminGlobalAttempt,
  AdminGlobalAttemptFilters,
  AdminGlobalAttemptListResponse,
  AdminQuiz,
  AdminQuizFilters,
  AdminQuizListResponse,
} from "@/types/admin";
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

export async function listAllAdminQuizzes(
  filters: AdminQuizFilters = {},
): Promise<AdminQuizListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search && filters.search.trim())
    params.set("search", filters.search.trim());
  const qs = params.toString();
  return apiClient.getFull<AdminQuizListResponse>(
    `/admin/quizzes${qs ? `?${qs}` : ""}`,
  );
}

export async function listAllAdminAttempts(
  filters: AdminGlobalAttemptFilters = {},
): Promise<AdminGlobalAttemptListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.status) params.set("status", filters.status);
  if (filters.search && filters.search.trim())
    params.set("search", filters.search.trim());
  const qs = params.toString();
  return apiClient.getFull<AdminGlobalAttemptListResponse>(
    `/admin/attempts${qs ? `?${qs}` : ""}`,
  );
}

export async function deleteQuiz(
  quizId: number | string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/quizzes/${quizId}`,
  );
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
