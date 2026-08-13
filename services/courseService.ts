/**
 * Course Service — services/courseService.ts
 *
 * Single source of truth for all course and enrollment API calls.
 * Uses apiClient from lib/api-client.ts (in-memory token, envelope parsing).
 */

import { apiClient } from '@/lib/api-client';
import { isMockCourse, mockCourse, MOCK_COURSE_ID } from '@/lib/mock/course';
import { PaginationMeta } from '@/types/api';

export { MOCK_COURSE_ID };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CourseListItem {
  id: number;
  title: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  grade?: string;
}

export interface CourseDetail extends CourseListItem {
  description_short?: string;
  duration?: string;
  files_count?: number;
  videos_count?: number;
  exams_count?: number;
  questions_count?: number | string;
  videos?: Array<{
    id: number;
    title: string;
    url?: string;
    thumbnail?: string;
    duration?: number;
    description?: string;
  }>;
}

export interface CoursesPage {
  data: CourseListItem[];
  meta: PaginationMeta;
}

export interface EnrollmentResult {
  courseId: number | string;
  enrolled: boolean;
  isPaid?: boolean;
}

/** Shape returned by the consolidated GET /courses/:id endpoint (inside data envelope).
 *  ponytail: videos are assumed ordered by position ASC from the backend.
 *  Add sort by position here only if ordering ever appears wrong in the UI.
 */
export interface CourseConsolidatedPayload {
  course: CourseDetail;
  videos: NonNullable<CourseDetail['videos']>;
  enrollment: { id: number; userId: number; courseId: number; isPaid: boolean } | null;
  progress: Array<{ videoId: number | string; completed: boolean; watchedAt: string | null }>;
}

// ---------------------------------------------------------------------------
// Response shapes — backend may return flat or wrapped
// ---------------------------------------------------------------------------

/** Safely extracts an array from either `{ success, data }` or a flat array/object. */
function extractData<T>(raw: unknown): T {
  if (raw !== null && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if ('success' in obj && 'data' in obj) {
      return obj.data as T;
    }
  }
  return raw as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all courses with optional pagination.
 * Response: `{ success, data: CourseListItem[], meta }` (new envelope)
 */
export async function fetchAllCourses(page = 1, limit = 20): Promise<CoursesPage> {
  // apiClient.get already unwraps { success, data } if present,
  // but for paginated list we need the meta too — raw fetch here.
  const raw = await apiClient.get<{ success: boolean; data: CourseListItem[]; meta: PaginationMeta } | CourseListItem[]>(
    `/courses?page=${page}&limit=${limit}`,
  );

  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw) && 'data' in (raw as object)) {
    const envelope = raw as { data: CourseListItem[]; meta: PaginationMeta };
    return { data: envelope.data, meta: envelope.meta };
  }

  // Flat array fallback
  const arr = Array.isArray(raw) ? (raw as CourseListItem[]) : [];
  return {
    data: arr,
    meta: { total: arr.length, page, limit, totalPages: 1 },
  };
}

/**
 * Fetch a single course by its ID.
 * Returns the consolidated 4-field payload: { course, videos, enrollment, progress }.
 * Legacy shape (course object as data root) is gracefully unwrapped via fallback branch.
 */
export async function fetchCourseById(courseId: string | number): Promise<CourseConsolidatedPayload> {
  if (isMockCourse(courseId)) {
    // ponytail: dev mock path — keep enrolled=false to show subscribe CTA so the card is still testable.
    // Switch to a fake enrollment object below if you want the "already enrolled" mock view.
    return {
      course: mockCourse,
      videos: mockCourse.videos ?? [],
      enrollment: null,
      progress: [],
    };
  }
  const raw = await apiClient.get<unknown>(`/courses/${courseId}`);
  const envelope = extractData<
    | {
        course: CourseDetail;
        videos?: CourseDetail['videos'];
        enrollment?: CourseConsolidatedPayload['enrollment'];
        progress?: CourseConsolidatedPayload['progress'];
      }
    | CourseDetail
  >(raw);

  // Guard: detect new consolidated shape (has both `course` and `videos` keys at envelope root)
  // vs legacy shape where `envelope` IS the CourseDetail directly.
  if (envelope && typeof envelope === 'object' && 'course' in envelope && envelope.course && typeof envelope.course === 'object' && 'id' in envelope.course) {
    const consolidated = envelope as {
      course: CourseDetail;
      videos?: CourseDetail['videos'];
      enrollment?: CourseConsolidatedPayload['enrollment'];
      progress?: CourseConsolidatedPayload['progress'];
    };
    return {
      course: consolidated.course,
      videos: consolidated.videos ?? consolidated.course.videos ?? [],
      enrollment: consolidated.enrollment ?? null,
      progress: consolidated.progress ?? [],
    };
  }

  // Legacy fallback — envelope IS the course object.
  const legacyCourse = envelope as CourseDetail;
  return {
    course: legacyCourse,
    videos: legacyCourse.videos ?? [],
    enrollment: null,
    progress: [],
  };
}

/**
 * Check whether the authenticated user is enrolled in a course.
 * New API: POST /enroll/status  { courseId }
 */
export async function checkEnrollmentStatus(
  courseId: string | number,
): Promise<EnrollmentResult> {
  if (isMockCourse(courseId)) {
    return { courseId, enrolled: true, isPaid: false };
  }
  const raw = await apiClient.post<unknown>('/enroll/status', { courseId });
  const data = extractData<{ enrolled?: boolean; isPaid?: boolean }>(raw);
  return {
    courseId,
    enrolled: !!data.enrolled,
    isPaid: data.isPaid,
  };
}

/**
 * Enroll the authenticated user in a course.
 * POST /enroll/  { courseId }
 */
export async function enrollInCourse(courseId: string | number): Promise<EnrollmentResult> {
  if (isMockCourse(courseId)) {
    return { courseId, enrolled: true, isPaid: false };
  }
  const raw = await apiClient.post<unknown>('/enroll/', { courseId });
  const data = extractData<{ enrollment?: { isPaid?: boolean } }>(raw);
  return {
    courseId,
    enrolled: true,
    isPaid: data.enrollment?.isPaid ?? false,
  };
}