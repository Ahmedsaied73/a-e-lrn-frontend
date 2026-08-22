/**
 * Bunny Stream Video Service — services/bunnyVideoService.ts
 *
 * Provides typed wrappers around the two student-facing Bunny endpoints:
 *   - GET /courses/:courseId/bunny-videos  → list of videos in a course
 *   - GET /videos/:videoId/playback        → signed iframe embed URL
 *
 * Uses the centralized apiClient from lib/api-client.ts which:
 *   - Sends `credentials: 'include'` for HttpOnly cookie auth
 *   - Attaches an in-memory Bearer token if present
 *   - Automatically unwraps `{ success, data }` envelopes
 *   - Retries once after a silent token refresh on 401
 *   - Throws typed errors (ApiError, ForbiddenError, NotFoundError, etc.)
 */

import { apiClient } from '@/lib/api-client';
import { ForbiddenError, NotFoundError, ApiError } from '@/lib/errors';
import type { BunnyVideo, BunnyPlaybackData, BunnyErrorCode } from '@/types/bunny';

// ---------------------------------------------------------------------------
// Custom error class for Bunny-specific error codes
// ---------------------------------------------------------------------------

export class BunnyVideoError extends Error {
  constructor(
    public readonly code: BunnyErrorCode,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'BunnyVideoError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a video duration (in seconds) into a human-readable string.
 *
 * - < 3600 seconds → "MM:SS"
 * - ≥ 3600 seconds → "HH:MM:SS"
 *
 * Returns '—' if duration is null or undefined.
 */
export function formatBunnyDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return '—';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  if (h > 0) {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Fetches all Bunny Stream videos for a given course.
 *
 * - Students receive only READY videos (backend filters by enrollment).
 * - Admins receive all statuses plus debug fields.
 *
 * Returns an empty array (not a throw) when the course has no Bunny videos
 * or if the user is not enrolled (the backend returns [] rather than 403
 * for the list endpoint).
 *
 * @param courseId  The numeric or string course ID
 * @throws {ApiError} On network failure or unexpected server error
 */
export async function fetchBunnyCourseVideos(
  courseId: string | number,
): Promise<BunnyVideo[]> {
  try {
    // apiClient.get unwraps { success, data } automatically, so we get
    // the array directly.
    const data = await apiClient.get<BunnyVideo[]>(
      `/courses/${courseId}/bunny-videos`,
    );
    // Guard: ensure we always return an array even if the server sends null.
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // If the error is a 404 (course not found), return empty list gracefully.
    if (err instanceof NotFoundError) {
      return [];
    }
    // For 403 (not enrolled), the backend returns [] for list endpoints,
    // so this branch is just a safety net.
    if (err instanceof ForbiddenError) {
      return [];
    }
    // Re-throw everything else (network errors, 5xx, etc.)
    throw err;
  }
}

/**
 * Fetches a signed Bunny embed playback URL for a specific video.
 *
 * @param videoId  The numeric or string BunnyVideo.id (NOT the Bunny GUID)
 * @returns        BunnyPlaybackData with playbackUrl and expiresAt
 *
 * @throws {BunnyVideoError} with code 'VIDEO_ACCESS_DENIED' on 403
 * @throws {BunnyVideoError} with code 'VIDEO_NOT_FOUND'    on 404
 * @throws {BunnyVideoError} with code 'VIDEO_NOT_READY'    on 422
 * @throws {ApiError}        on network failure or unexpected server error
 */
export async function fetchBunnyPlaybackUrl(
  videoId: string | number,
): Promise<BunnyPlaybackData> {
  try {
    const data = await apiClient.get<BunnyPlaybackData>(
      `/videos/${videoId}/playback`,
    );
    return data;
  } catch (err) {
    // Map generic HTTP errors to Bunny-specific typed errors so the UI
    // can branch cleanly on error.code without string-matching messages.
    if (err instanceof ForbiddenError) {
      throw new BunnyVideoError(
        'VIDEO_ACCESS_DENIED',
        'يجب أن تكون مشتركًا في هذا الكورس لمشاهدة الفيديوهات',
        403,
      );
    }
    if (err instanceof NotFoundError) {
      throw new BunnyVideoError(
        'VIDEO_NOT_FOUND',
        'الفيديو غير موجود',
        404,
      );
    }
    // 422 — video not ready yet (still processing or failed)
    if (err instanceof ApiError && err.status === 422) {
      throw new BunnyVideoError(
        'VIDEO_NOT_READY',
        'الفيديو لا يزال قيد المعالجة، يرجى المحاولة مرة أخرى لاحقًا',
        422,
      );
    }
    // Re-throw everything else (network errors, 5xx, etc.)
    throw err;
  }
}
