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

export interface CourseDetail extends CourseListItem {
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
 */
export async function fetchCourseById(courseId: string | number): Promise<CourseDetail> {
  const raw = await apiClient.get<unknown>(`/courses/${courseId}`);
  return extractData<CourseDetail>(raw);
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