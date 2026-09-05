/**
 * Quiz/Exam type definitions — types/quiz.ts
 *
 * Single source of truth for all quiz-related TypeScript interfaces.
 * Field names match the backend API exactly (see quizController.js / quizService.js).
 *
 * Do NOT add client-side computed fields here — only shapes returned by the API.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type AttemptStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'GRADING'
  | 'GRADED'
  | 'EXPIRED';

// ---------------------------------------------------------------------------
// GET /quizzes/videos/:videoId/meta
// ---------------------------------------------------------------------------

export interface QuizMetaNoQuiz {
  exists: false;
  videoId: number;
  videoTitle: string;
}

export interface InProgressAttemptInfo {
  id: number;
  attemptNumber: number;
  deadlineAt: string | null;
}

export interface QuizMetaExists {
  exists: true;
  quizId: number;
  videoId: number;
  videoTitle: string;
  title: string;
  timeLimitSec: number | null;
  passingScore: number;
  maxAttempts: number;
  attemptsUsed: number;
  atMaxAttempts: boolean;
  unlocked: boolean;
  attempted: boolean;
  totalAttempts: number;
  passed: boolean;
  bestScore: number | null;
  inProgressAttempt: InProgressAttemptInfo | null;
  totalQuestions: number;
  totalPoints: number;
}

export type QuizMeta = QuizMetaNoQuiz | QuizMetaExists;

// ---------------------------------------------------------------------------
// POST /quizzes/videos/:videoId/start  (also resume)
// ---------------------------------------------------------------------------

export interface StudentSafeQuiz {
  id: number;
  videoId: number;
  title: string;
  timeLimitSec: number | null;
  passingScore: number;
  maxAttempts: number;
  surveyJson: Record<string, unknown>;
}

export interface StartQuizData {
  attemptId: number;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  deadlineAt: string | null;
  resumed: boolean;
  responses: Record<string, unknown> | null;
  quiz: StudentSafeQuiz;
}

export interface SaveQuizData {
  attemptId: number;
  saved: boolean;
}

export interface AdminQuizAttempt {
  id: number;
  quizId: number;
  userId: number;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  scorePercent: number | null;
  earnedPoints: number | null;
  totalPoints: number | null;
  autoSubmitted: boolean;
  user?: { id: number; name: string | null; email: string };
}

export interface UpsertQuizInput {
  title: string;
  timeLimitSec: number | null;
  passingScore: number;
  maxAttempts?: number;
  surveyJson: Record<string, unknown>;
  answerKey: Record<string, unknown>;
}

export interface GradeAttemptInput {
  essayScores: Record<string, number>;
  essayFeedback?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// POST /quizzes/attempts/:id/submit
// ---------------------------------------------------------------------------

export interface McqPerQuestion {
  qName: string;
  isCorrect: boolean;
  earned: number;
  max: number;
}

export interface SubmitQuizData {
  attemptId: number;
  status: 'GRADED' | 'GRADING';
  earnedPoints: number;
  totalPoints: number;
  scorePercent: number;
  hasEssays: boolean;
  perQuestion: McqPerQuestion[];
}

// ---------------------------------------------------------------------------
// GET /quizzes/attempts/:id/result
// ---------------------------------------------------------------------------

export interface McqResultQuestion {
  name: string;
  type: 'radiogroup';
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
}

export interface EssayResultQuestion {
  name: string;
  type: 'comment';
  studentAnswer: string | null;
  modelAnswer: string;
  earnedPoints: number | null;
  maxPoints: number;
  feedback: string | null;
  status: 'GRADED' | 'PENDING_REVIEW';
}

export type ResultQuestion = McqResultQuestion | EssayResultQuestion;

export interface QuizResultData {
  attemptId: number;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  autoSubmitted: boolean;
  earnedPoints: number | null;
  totalPoints: number | null;
  scorePercent: number | null;
  passed: boolean;
  passingScore: number;
  questions: ResultQuestion[];
}

// ---------------------------------------------------------------------------
// GET /quizzes/videos/:videoId/attempts
// ---------------------------------------------------------------------------

export interface AttemptSummary {
  id: number;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  scorePercent: number | null;
  earnedPoints: number | null;
  totalPoints: number | null;
  autoSubmitted: boolean;
}

export interface StudentAttemptsData {
  quizId: number;
  title: string;
  passingScore: number;
  attempts: AttemptSummary[];
}

// ---------------------------------------------------------------------------
// Sequential gate — 403 body from /stream/* endpoints
// ---------------------------------------------------------------------------

export interface QuizGate403 {
  message: string;
  code?: 'SEQUENTIAL_GATE' | 'NOT_ENROLLED' | 'VIDEO_NOT_FOUND';
  previousVideoId?: number;
  currentVideoId?: number;
  quizId?: number;
  yourScore?: number | null;
  requiredScore?: number;
}

// ---------------------------------------------------------------------------
// GET /user/me/achievements
// ---------------------------------------------------------------------------

export interface AchievementCourse {
  id: number;
  title: string;
  description: string | null;
  thumbnail: string | null;
  grade: string | null;
}

export interface AchievementProgress {
  watched: number;
  total: number;
  percent: number;
  completed: boolean;
}

export interface AchievementExam {
  videoId: number;
  videoTitle: string;
  quizId: number;
  quizTitle: string;
  passingScore: number;
  timeLimitSec: number | null;
  maxAttempts: number;
  bestScore: number | null;
  passed: boolean;
  attemptsUsed: number;
}

export interface AchievementCourseEntry {
  course: AchievementCourse;
  progress: AchievementProgress;
  exams: AchievementExam[];
}

export interface AchievementsTotals {
  coursesEnrolled: number;
  coursesCompleted: number;
  videosWatched: number;
  videosTotal: number;
  examsTaken: number;
  examsPassed: number;
  averageScore: number | null;
}

export interface AchievementsData {
  totals: AchievementsTotals;
  courses: AchievementCourseEntry[];
}
