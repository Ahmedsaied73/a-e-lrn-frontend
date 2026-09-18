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
  videoSlug: string,
  input: UpsertQuizInput,
): Promise<StudentSafeQuiz> {
  return apiClient.post<StudentSafeQuiz>(`/quizzes/videos/${videoSlug}`, input);
}

export async function listQuizAttempts(
  quizSlug: string,
  status = "GRADING",
): Promise<AdminQuizAttempt[]> {
  return apiClient.get<AdminQuizAttempt[]>(
    `/quizzes/${quizSlug}/attempts?status=${encodeURIComponent(status)}`,
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
  quizSlug: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/quizzes/${quizSlug}`,
  );
}

/**
 * Upload a question image from the admin's device (file-explorer picker).
 * Proxied by the backend to Supabase Storage — returns the public URL
 * to store as the question `imageLink`.
 */
export async function uploadQuizImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const data = await apiClient.postFormData<{ url: string }>(`/quizzes/images`, formData);
  if (!data || typeof data.url !== "string" || !data.url.trim()) {
    throw new Error("استجابة غير متوقعة من الخادم.");
  }
  return data.url;
}

export async function grantQuizExemption(
  videoSlug: string,
  userSlug: string,
  reason?: string,
): Promise<{ id: number }> {
  return apiClient.post<{ id: number }>(`/quizzes/videos/${videoSlug}/exemptions`, {
    userSlug,
    reason,
  });
}

export async function revokeQuizExemption(exemptionId: number | string): Promise<void> {
  await apiClient.delete(`/quizzes/exemptions/${exemptionId}`);
}
