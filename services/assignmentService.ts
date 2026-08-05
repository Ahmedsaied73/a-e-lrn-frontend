/**
 * Assignment Service — services/assignmentService.ts
 *
 * Single source of truth for all assignment API calls.
 * Uses apiClient from lib/api-client.ts (in-memory token, envelope parsing).
 */

import { apiClient } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssignmentQuestion {
  id: number;
  text: string;
  options: string[] | { id: number; text: string }[];
  points: number;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  videoId: number | null;
  dueDate: string;
  isMCQ: boolean;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
  hasSubmitted: boolean;
  submission: {
    id: number;
    status: string;
    grade: number;
    submittedAt: string;
  } | null;
  questions?: AssignmentQuestion[];
  AssignmentQuestion?: AssignmentQuestion[];
}

export interface AssignmentResult {
  assignmentId?: number;
  title?: string;
  mcqScore?: number;
  grade?: number;
  passingScore?: number;
  passed?: boolean;
  submittedAt?: string;
  status?: string;
  message?: string;
  submission?: {
    id: number;
    status: string;
    grade?: number;
    mcqScore?: number;
    submittedAt: string;
  };
}

export interface AssignmentStatus {
  assignmentId: number;
  title: string;
  submitted: boolean;
  status: 'GRADED' | 'PENDING' | 'NOT_SUBMITTED';
  message: string;
  dueDate: string;
  isPastDue: boolean;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  courseId: number;
  courseTitle: string;
  status: string;
  submittedAt: string;
  gradedAt: string | null;
  grade: number | null;
  totalPoints: number;
  feedback: string | null;
}

// ---------------------------------------------------------------------------
// Helper — resilient unwrap (flat OR {success,data} envelope)
// ---------------------------------------------------------------------------
function unwrap<T>(raw: unknown): T {
  if (raw !== null && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if ('success' in obj && 'data' in obj) {
      return obj.data as T;
    }
  }
  return raw as T;
}

// ---------------------------------------------------------------------------
// Assignment API calls
// ---------------------------------------------------------------------------

/**
 * GET /assignments/video/:videoId
 * Returns all assignments linked to a specific video.
 * Response shape: { assignments: Assignment[] }  (flat, no envelope)
 */
export async function fetchAssignmentsByVideo(videoId: string | number): Promise<Assignment[]> {
  const raw = await apiClient.get<unknown>(`/assignments/video/${videoId}`);
  const data = unwrap<Assignment[] | { assignments?: Assignment[] }>(raw);
  if (Array.isArray(data)) return data;
  if (data && 'assignments' in data && Array.isArray(data.assignments)) return data.assignments;
  return [];
}

/**
 * GET /assignments/:assignmentId
 * Returns a single assignment with its questions.
 */
export async function fetchAssignmentById(assignmentId: number): Promise<Assignment> {
  const raw = await apiClient.get<unknown>(`/assignments/${assignmentId}`);
  return unwrap<Assignment>(raw);
}

/**
 * POST /assignments/submit
 * Submit an assignment (MCQ or open-ended).
 *
 * For MCQ:      { assignmentId, answers: [{ questionId, selectedOption }] }
 * For regular:  { assignmentId, content, fileUrl? }
 */
export async function submitAssignment(payload: {
  assignmentId: number;
  answers?: { questionId: number; selectedOption: number }[];
  content?: string;
  fileUrl?: string;
}): Promise<AssignmentResult> {
  const raw = await apiClient.post<unknown>('/assignments/submit', payload);
  return unwrap<AssignmentResult>(raw);
}

/**
 * GET /assignments/:assignmentId/status
 * Check whether the user has submitted a specific assignment.
 */
export async function fetchAssignmentStatus(assignmentId: number): Promise<AssignmentStatus> {
  const raw = await apiClient.get<unknown>(`/assignments/${assignmentId}/status`);
  return unwrap<AssignmentStatus>(raw);
}

/**
 * GET /assignments/:assignmentId/submissions
 * Fetch all submissions for the authenticated user for a given assignment.
 */
export async function fetchAssignmentSubmissions(
  assignmentId: number,
): Promise<AssignmentSubmission[]> {
  const raw = await apiClient.get<unknown>(`/assignments/${assignmentId}/submissions`);
  const data = unwrap<AssignmentSubmission[] | { submissions?: AssignmentSubmission[] }>(raw);
  if (Array.isArray(data)) return data;
  if (data && 'submissions' in data && Array.isArray(data.submissions)) return data.submissions;
  return [];
}
