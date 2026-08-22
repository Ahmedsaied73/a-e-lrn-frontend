/**
 * Bunny.net Stream — TypeScript type definitions
 *
 * Mirrors the backend BunnyVideo Prisma model and API response shapes.
 * These types are used by bunnyVideoService.ts and the course/video pages.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type BunnyVideoStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED';

// ---------------------------------------------------------------------------
// Domain Models
// ---------------------------------------------------------------------------

/**
 * A single Bunny Stream video record as returned by
 * GET /courses/:courseId/bunny-videos
 *
 * Students only ever receive videos with status === 'READY'.
 * Admins additionally receive failureReason and processingProgress.
 */
export interface BunnyVideo {
  id: number;
  courseId: number;
  title: string;
  status: BunnyVideoStatus;

  /** Video duration in seconds. Null until the video reaches READY status. */
  duration: number | null;

  width: number | null;
  height: number | null;

  /**
   * Full Bunny CDN thumbnail URL.
   * Pattern: https://vz-<hash>.b-cdn.net/<guid>/thumbnail.jpg
   */
  thumbnailUrl: string | null;

  createdAt: string;

  // Admin-only debug fields (undefined for student responses)
  failureReason?: string | null;
  processingProgress?: number | null;
}

// ---------------------------------------------------------------------------
// API Response Shapes
// ---------------------------------------------------------------------------

/**
 * Returned by GET /videos/:videoId/playback
 * The playbackUrl is a signed Bunny iframe embed URL valid until expiresAt.
 */
export interface BunnyPlaybackData {
  videoId: number;
  /**
   * Fully-formed signed Bunny embed URL, ready to drop into an <iframe src>.
   * Example: https://iframe.mediadelivery.net/embed/LIBRARY_ID/VIDEO_GUID?token=...&expires=...
   */
  playbackUrl: string;
  /** Unix timestamp (seconds) when the signed token expires. */
  expiresAt: number;
}

/**
 * Error codes returned by Bunny video endpoints.
 * Used for granular error handling in the UI.
 */
export type BunnyErrorCode =
  | 'VIDEO_ACCESS_DENIED' // 403 — student not enrolled
  | 'VIDEO_NOT_FOUND'     // 404 — video doesn't exist
  | 'VIDEO_NOT_READY'     // 422 — still processing or failed
  | 'VALIDATION_ERROR'    // 400 — bad request
  | 'BUNNY_API_ERROR';    // 502 — upstream Bunny failure
