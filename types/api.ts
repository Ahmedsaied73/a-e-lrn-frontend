/**
 * Shared API response type definitions.
 * These mirror the backend's standardized response envelope exactly.
 */

/** Pagination metadata included on every list endpoint */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Wrapper for a single-item successful response */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/** Wrapper for a paginated list response */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

/** Standard error envelope returned by the backend */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

// ---------------------------------------------------------------------------
// Domain-level types — reflect current API schema
// ---------------------------------------------------------------------------

export type GradeEnum =
  | 'FIRST_SECONDARY'
  | 'SECOND_SECONDARY'
  | 'THIRD_SECONDARY';

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  grade: GradeEnum;
  role: 'STUDENT' | 'ADMIN';
  createdAt: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  grade: GradeEnum;
}

export interface Video {
  id: number;
  title: string;
  url?: string;
  thumbnail?: string;
  duration?: number;
  description?: string;
}

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  isPaid: boolean;
}

export interface EnrollmentStatusResponse {
  enrolled: boolean;
  courseId: number;
}
