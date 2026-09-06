/**
 * Admin Video Service — services/adminVideoService.ts
 *
 * Admin-only management of a course's Bunny Stream videos.
 *  - GET    /courses/:courseId/bunny-videos — list all videos (incl. status/progress/failure)
 *  - POST   /courses/:courseId/videos       — create a PENDING video row
 *  - POST   /videos/:videoId/upload          — stream a binary file to Bunny (multipart, field "video")
 *  - PUT    /courses/:courseId/reorder       — set video order
 *  - DELETE /videos/bunny/:videoId           — delete (Bunny remote first, then DB)
 */

import { apiClient } from '@/lib/api-client';
import type { BunnyVideo } from '@/types/bunny';

export interface CreateVideoResult {
  id: number;
  courseId: number;
  title: string;
  status: string;
}

export async function getCourseVideos(courseId: number): Promise<BunnyVideo[]> {
  return apiClient.get<BunnyVideo[]>(`/courses/${courseId}/bunny-videos`);
}

export async function createVideo(courseId: number, title: string): Promise<CreateVideoResult> {
  return apiClient.post<CreateVideoResult>(`/courses/${courseId}/videos`, { title });
}

export async function uploadVideo(videoId: number, file: File): Promise<{ videoId: number; status: string; message?: string }> {
  const formData = new FormData();
  formData.append('video', file);
  return apiClient.postFormData<{ videoId: number; status: string; message?: string }>(
    `/videos/${videoId}/upload`,
    formData,
  );
}

export async function reorderVideos(courseId: number, videoIds: number[]): Promise<{ id: number; title: string; position: number }[]> {
  return apiClient.put<{ id: number; title: string; position: number }[]>(`/courses/${courseId}/reorder`, { videoIds });
}

export async function deleteVideo(videoId: number): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(`/videos/bunny/${videoId}`);
}
