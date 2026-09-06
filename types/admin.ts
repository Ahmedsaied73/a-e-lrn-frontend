/**
 * Admin console types — mirror the backend /admin payloads exactly.
 * @see H:\e-learning-platform\src\controllers\adminController.js
 */

import type { GradeEnum, User } from './api';

export type RoleEnum = 'STUDENT' | 'ADMIN';

/** Admin list row — backend safe-select adds lastLoginAt, no password/refreshToken. */
export interface AdminUser extends Pick<User, 'id' | 'name' | 'email' | 'grade' | 'role' | 'createdAt'> {
  lastLoginAt: string | null;
  phoneNumber?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserListResponse {
  success: boolean;
  data: AdminUser[];
  meta: PaginationMeta;
}

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  role?: RoleEnum;
  grade?: GradeEnum | '';
  search?: string;
  sort?: string;
}

export type VideoStatus = 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED' | 'EXPIRED';

export interface AttemptCounts {
  IN_PROGRESS: number;
  SUBMITTED?: number;
  GRADING: number;
  GRADED: number;
  EXPIRED: number;
}

export interface VideoCounts {
  total: number;
  PENDING?: number;
  UPLOADING?: number;
  PROCESSING?: number;
  READY?: number;
  FAILED?: number;
}

export interface AdminCounts {
  students: number;
  admins: number;
  courses: number;
  enrollments: number;
  quizzes: number;
  newStudentsLast7d: number;
  attempts: AttemptCounts;
  videos: VideoCounts;
  submissionsPending: number;
}

export interface FailedVideo {
  id: number;
  title: string;
  courseId: number;
  failureReason?: string | null;
  updatedAt: string;
}

export interface StuckVideo {
  id: number;
  title: string;
  courseId: number;
  processingProgress?: number | null;
  updatedAt: string;
  stuckMinutes: number;
}

export interface EssayPendingAttempt {
  id: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'grade' | 'createdAt'>;
  quiz: {
    id: number;
    title: string;
    bunnyVideo: { id: number; title: string } | null;
  } | null;
}

export interface AdminAlerts {
  failedVideos: FailedVideo[];
  stuckProcessingVideos: StuckVideo[];
  essaysPendingGrading: EssayPendingAttempt[];
  hasIssues: boolean;
}

export interface AdminRecentEnrollment {
  id: number;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'grade' | 'createdAt'>;
  course: { id: number; title: string; grade: GradeEnum };
}

export interface AdminRecentAttempt {
  id: number;
  status: AttemptStatus;
  scorePercent?: number | null;
  startedAt: string;
  submittedAt?: string | null;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'grade' | 'createdAt'>;
  quiz: {
    id: number;
    title: string;
    passingScore: number;
    bunnyVideo: { title: string } | null;
  } | null;
}

export interface AdminRecent {
  users: Pick<User, 'id' | 'name' | 'email' | 'role' | 'grade' | 'createdAt'>[];
  enrollments: AdminRecentEnrollment[];
  attempts: AdminRecentAttempt[];
}

export interface AdminDashboardData {
  counts: AdminCounts;
  alerts: AdminAlerts;
  recent: AdminRecent;
}

/** Admin course list row — GET /courses returns _count + category. */
export interface AdminCourse {
  id: number;
  title: string;
  description?: string | null;
  price?: number | null;
  thumbnail?: string | null;
  grade: GradeEnum;
  category?: string | null;
  createdAt: string;
  teacher: Pick<User, 'id' | 'name' | 'email'>;
  _count: { videos: number; enrollments: number };
}

export interface AdminCourseListResponse {
  success: boolean;
  data: AdminCourse[];
  meta: PaginationMeta;
}

export interface AdminCourseFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminCourseInput {
  title: string;
  description: string;
  price: number;
  grade: GradeEnum;
  category?: string;
  thumbnail?: string;
}