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
  /** Opaque public identifier (backend assigns u_<random>) — used in /user/:slug routes. */
  slug: string;
  name: string;
  email: string;
  phoneNumber?: string;
  grade: GradeEnum;
  role: 'STUDENT' | 'ADMIN';
  createdAt: string;
  /** Server-truth feature flags (clients must never decide enablement). */
  features?: {
    notifications?: boolean;
    aiGrader?: boolean;
  };
}

export interface Course {
  /** Public URL identifier — numeric id is never exposed by the backend. */
  slug: string;
  title: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  grade: GradeEnum;
  category?: string | null;
  teacher?: Pick<User, 'slug' | 'name' | 'email'>;
  videoCount?: number;
  enrollmentCount?: number;
}

export interface Enrollment {
  id: number;
  isPaid: boolean;
  paymentDate?: string | null;
  startedAt?: string;
  lastAccess?: string | null;
  createdAt?: string;
}

export interface EnrollmentStatusResponse {
  enrolled: boolean;
  enrollment: Enrollment | null;
}
