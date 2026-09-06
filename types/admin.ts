/**
 * Admin console types — mirror the backend /admin payloads exactly.
 * @see H:\e-learning-platform\src\controllers\adminController.js
 */

import type { GradeEnum, User } from './api';

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