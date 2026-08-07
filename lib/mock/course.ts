import type { CourseDetail } from '@/services/courseService';
import type { Quiz, QuizResult, QuizStatus, VideoProgress } from '@/services/quizService';
import type { Assignment, AssignmentStatus } from '@/services/assignmentService';

export const MOCK_COURSE_ID = 'mock';

const MOCK_VIDEO_IDS = [9001, 9002, 9003] as const;
const MOCK_QUIZ_IDS = [9001, 9002] as const;
const MOCK_ASSIGNMENT_ID = 9001;

export function isMockCourse(courseId: string | number): boolean {
  return String(courseId) === MOCK_COURSE_ID;
}

export function isMockVideoId(videoId: string | number): boolean {
  return MOCK_VIDEO_IDS.includes(Number(videoId) as (typeof MOCK_VIDEO_IDS)[number]);
}

export function isMockQuizId(quizId: number): boolean {
  return MOCK_QUIZ_IDS.includes(quizId as (typeof MOCK_QUIZ_IDS)[number]);
}

export function isMockAssignmentId(assignmentId: number): boolean {
  return assignmentId === MOCK_ASSIGNMENT_ID;
}

export const mockCourse: CourseDetail = {
  id: 0,
  title: 'كورس الكيمياء — الصف الثالث الثانوي',
  description:
    'كورس شامل في الكيمياء للصف الثالث الثانوي يغطي التحليل الكيميائي، الكيمياء العضوية، والتفاعلات الكيميائية.',
  description_short: 'مع الأستاذ عبد الهادي موسى — شرح مبسّط وامتحانات تفاعلية',
  price: 0,
  thumbnail: '/placeholder-course.jpg',
  grade: 'الصف الثالث الثانوي',
  files_count: 5,
  videos_count: 3,
  exams_count: 2,
  videos: [
    {
      id: 9001,
      title: 'مقدمة في الكيمياء العضوية',
      description: 'تعريف بالكيمياء العضوية والروابط الكربونية',
      duration: 720,
    },
    {
      id: 9002,
      title: 'التفاعلات الكيميائية',
      description: 'أنواع التفاعلات وموازنة المعادلات',
      duration: 900,
    },
    {
      id: 9003,
      title: 'التحليل الكيميائي',
      description: 'طرق التحليل الكمي والنوعي',
      duration: 840,
    },
  ],
};

export const mockQuizzes: Quiz[] = [
  {
    id: 9001,
    title: 'اختبار الكيمياء العضوية',
    description: 'اختبار قصير على المحاضرة الأولى',
    isFinal: false,
    passingScore: 60,
    videoId: 9001,
    videoTitle: 'مقدمة في الكيمياء العضوية',
    questionCount: 3,
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 9002,
    title: 'اختبار التفاعلات الكيميائية',
    description: 'اختبار على المحاضرة الثانية',
    isFinal: false,
    passingScore: 60,
    videoId: 9002,
    videoTitle: 'التفاعلات الكيميائية',
    questionCount: 2,
    createdAt: '2026-01-20T10:00:00.000Z',
  },
];

export const mockQuizDetails: Record<number, Quiz> = {
  9001: {
    ...mockQuizzes[0],
    questions: [
      {
        id: 1,
        text: 'ما العنصر الأساسي في الكيمياء العضوية؟',
        options: ['الهيدروجين', 'الكربون', 'الأكسجين', 'النيتروجين'],
        points: 1,
      },
      {
        id: 2,
        text: 'ما نوع الرابطة في مركب الميثان CH₄؟',
        options: ['أيونية', 'تساندية', 'فلزية', 'هيدروجينية'],
        points: 1,
      },
      {
        id: 3,
        text: 'أي من التالي يُعد مركبًا عضويًا؟',
        options: ['NaCl', 'CO₂', 'C₂H₅OH', 'H₂SO₄'],
        points: 1,
      },
    ],
  },
  9002: {
    ...mockQuizzes[1],
    questions: [
      {
        id: 4,
        text: 'تفاعل الاحتراق هو مثال على:',
        options: ['تفاعل ارتباط', 'تفاعل أكسدة-اختزال', 'تفاعل تر precipitate', 'تفاعل معاكس'],
        points: 1,
      },
      {
        id: 5,
        text: 'عند موازنة المعادلة يجب أن يتساوى:',
        options: ['عدد الجزيئات فقط', 'عدد الذرات لكل عنصر', 'الكتلة فقط', 'الحجم فقط'],
        points: 1,
      },
    ],
  },
};

export const mockAssignments: Assignment[] = [
  {
    id: MOCK_ASSIGNMENT_ID,
    title: 'واجب الكيمياء العضوية',
    description: 'أسئلة تطبيقية على المحاضرة الأولى',
    videoId: 9001,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isMCQ: true,
    passingScore: 2,
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
    hasSubmitted: false,
    submission: null,
  },
];

export function getMockVideoStream(videoId: string | number) {
  const video = mockCourse.videos?.find((v) => v.id === Number(videoId));
  return {
    isYoutube: true,
    url: 'https://www.youtube.com/watch?v=7DjsD-jQPFw',
    embedHtml:
      '<iframe src="https://www.youtube.com/embed/7DjsD-jQPFw?rel=0&modestbranding=1"></iframe>',
    title: video?.title ?? 'محاضرة الكيمياء',
  };
}

export function getMockVideoProgress(videoId: string | number): VideoProgress {
  return {
    videoId,
    completed: false,
    watchedAt: null,
  };
}

export function getMockQuizStatus(quizId: number): QuizStatus {
  const quiz = mockQuizzes.find((q) => q.id === quizId);
  return {
    quizId,
    title: quiz?.title ?? 'اختبار',
    taken: false,
    status: null,
    score: null,
    passingScore: quiz?.passingScore ?? 60,
    passed: false,
    submittedAt: null,
  };
}

export function getMockAssignmentStatus(assignmentId: number): AssignmentStatus {
  const assignment = mockAssignments.find((a) => a.id === assignmentId);
  return {
    assignmentId,
    title: assignment?.title ?? 'واجب',
    submitted: false,
    status: 'NOT_SUBMITTED',
    message: 'لم يتم التسليم بعد',
    dueDate: assignment?.dueDate ?? new Date().toISOString(),
    isPastDue: false,
  };
}

export function getMockQuizResult(quizId: number): QuizResult {
  const quiz = mockQuizDetails[quizId];
  const total = quiz?.questions?.length ?? 0;
  return {
    quizId,
    title: quiz?.title ?? 'اختبار',
    correctAnswers: total,
    totalQuestions: total,
    score: 100,
    passingScore: quiz?.passingScore ?? 60,
    passed: true,
    submittedAt: new Date().toISOString(),
    results: [],
  };
}
