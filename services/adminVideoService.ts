/**
 * Admin Video Service — services/adminVideoService.ts
 *
 * Admin-only management of a course's Bunny Stream videos.
 *  - GET    /courses/:courseSlug/bunny-videos — list all videos (incl. status/progress/failure)
 *  - POST   /courses/:courseSlug/videos       — create a PENDING video row
 *  - POST   /videos/:videoSlug/upload         — stream a binary file to Bunny (multipart, field "video")
 *  - PUT    /courses/:courseSlug/reorder      — set video order (body: { videoSlugs: string[] })
 *  - DELETE /videos/bunny/:videoSlug          — delete (Bunny remote first, then DB)
 */

import { apiClient } from '@/lib/api-client';
import type { BunnyVideo } from '@/types/bunny';

export interface CreateVideoResult {
  slug: string;
  courseSlug: string;
  title: string;
  status: string;
}

export async function getCourseVideos(courseSlug: string): Promise<BunnyVideo[]> {
  return apiClient.get<BunnyVideo[]>(`/courses/${courseSlug}/bunny-videos`);
}

export async function createVideo(courseSlug: string, title: string): Promise<CreateVideoResult> {
  return apiClient.post<CreateVideoResult>(`/courses/${courseSlug}/videos`, { title });
}

export async function uploadVideo(videoSlug: string, file: File): Promise<{ videoSlug: string; status: string; message?: string }> {
  const formData = new FormData();
  formData.append('video', file);
  return apiClient.postFormData<{ videoSlug: string; status: string; message?: string }>(
    `/videos/${videoSlug}/upload`,
    formData,
  );
}

export async function reorderVideos(courseSlug: string, videoSlugs: string[]): Promise<{ slug: string; title: string; position: number }[]> {
  return apiClient.put<{ slug: string; title: string; position: number }[]>(`/courses/${courseSlug}/reorder`, { videoSlugs });
}

export async function deleteVideo(videoSlug: string): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(`/videos/bunny/${videoSlug}`);
}