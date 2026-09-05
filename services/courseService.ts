/**
 * Course Service — services/courseService.ts
 *
 * Single source of truth for all course and enrollment API calls.
 * Uses apiClient from lib/api-client.ts (in-memory token, envelope parsing).
 */

import { apiClient } from '@/lib/api-client';
import { PaginationMeta } from '@/types/api';

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

/**
 * The authenticated user's own enrollment row for a course, as returned
 * inline by GET /courses/:id — never another user's.
 */
export interface CourseEnrollment {
  id: number;
  userId: number;
  courseId: number;
  isPaid: boolean;
  paymentDate?: string | null;
  progress: number;
  startedAt: string;
  completedAt: string | null;
  isCompleted: boolean;
  lastAccess: string;
  createdAt: string;
}

/**
 * A single element of GET /courses/enrolled — an enrollment row with the
 * course object nested on it.
 */
export interface EnrolledCourseEntry {
  id: number;
  createdAt: string;
  course: CourseListItem & Record<string, unknown>;
}

export interface VideoProgress {
  videoId: number | string;
  completed: boolean;
  watchedAt: string | null;
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
    position?: number;
  }>;
  /** The authenticated user's enrollment for this course, or null if not enrolled. */
  enrollment?: CourseEnrollment | null;
  /** The authenticated user's video progress, scoped to this course's videos. */
  progress?: VideoProgress[];
}

export interface CoursesPage {
  data: CourseListItem[];
  meta: PaginationMeta;
}

export interface EnrollmentResult {
  courseId: number | string;
  enrolled: boolean;
  isPaid?: boolean;
};

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
 *
 * Backend response is the aggregate shape `{ success, data: { course, videos,
 * enrollment, progress } }` — course, the authenticated user's videos,
 * enrollment, and video progress all come back in this one call, so the
 * Course page never needs separate enrollment-status or per-video progress
 * requests to initialize.
 */
export async function fetchCourseById(courseId: string | number): Promise<CourseDetail> {
  const raw = await apiClient.get<unknown>(`/courses/${courseId}`);
  const payload = extractData<{
    course: CourseListItem & Record<string, unknown>;
    videos?: CourseDetail['videos'];
    enrollment?: CourseEnrollment | null;
    progress?: VideoProgress[];
  }>(raw);

  return {
    ...(payload.course as object),
    videos: payload.videos ?? [],
    enrollment: payload.enrollment ?? null,
    progress: payload.progress ?? [],
  } as CourseDetail;
}

/**
 * Check whether the authenticated user is enrolled in a course.
 * New API: POST /enroll/status  { courseId }
 */
export async function checkEnrollmentStatus(
  courseId: string | number,
): Promise<EnrollmentResult> {
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
  const raw = await apiClient.post<unknown>('/enroll/', { courseId });
  const data = extractData<{ enrollment?: { isPaid?: boolean } }>(raw);
  return {
    courseId,
    enrolled: true,
    isPaid: data.enrollment?.isPaid ?? false,
  };
}

/**
 * Fetch the authenticated user's enrolled courses.
 * GET /courses/enrolled
 *
 * Backend returns `{ success, data: [{ id: enrollmentId, createdAt, course }] }`
 * — this unwraps the nested course objects into a flat CourseListItem[].
 */
export async function getEnrolledCourses(): Promise<CourseListItem[]> {
  const raw = await apiClient.get<unknown>('/courses/enrolled');
  const data = extractData<EnrolledCourseEntry[]>(raw);

  if (!Array.isArray(data)) return [];
  return data
    .map((entry) => entry.course)
    .filter((course): course is (CourseListItem & Record<string, unknown>) => !!course);
}
