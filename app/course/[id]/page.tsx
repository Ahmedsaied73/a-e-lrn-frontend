'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { EnrollmentCard } from '@/components/enrollment-card';
import Link from "next/link";
import { ChevronDown, ChevronUp, Play, Check, CheckCircle, Award, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCourseById,
  selectCurrentCourse,
  selectEnrollmentStatus,
  selectCoursesLoading,
  selectCoursesError,
} from '@/store/slices/courseSlice';
import {
  fetchQuizzesByCourse,
  selectQuizzes,
  fetchQuizStatus,
  selectVideoProgress,
  selectQuizStatus,
} from '@/store/slices/quizSlice';
import {
  fetchAssignmentStatus,
  selectAssignments,
  fetchAssignmentsByCourse,
} from '@/store/slices/assignmentSlice';

export default function Page({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const [openVideoIds, setOpenVideoIds] = useState<Record<string, boolean>>({});
  const [courseDuration, setCourseDuration] = useState<string>('0');
  const [totalQuestions, setTotalQuestions] = useState<number>(0);

  // ---- Redux selectors ----------------------------------------------------
  const course = useAppSelector(selectCurrentCourse);
  const isEnrolled = useAppSelector(selectEnrollmentStatus(params.id));
  const loading = useAppSelector(selectCoursesLoading);
  const error = useAppSelector(selectCoursesError);

  const quizzes = useAppSelector(selectQuizzes);
  const videoProgressMap = useAppSelector((state) => state.quiz.videoProgressMap);
  const quizStatusMap = useAppSelector((state) => state.quiz.quizStatuses);

  const assignments = useAppSelector(selectAssignments);
  const assignmentStatusMap = useAppSelector((state) => state.assignment.assignmentStatuses);

  // ---- UI helpers ---------------------------------------------------------

  const toggleVideo = (videoId: string) => {
    setOpenVideoIds((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const getArabicOrdinal = (index: number) => {
    const arabicOrdinals = [
      'الأولى',
      'الثانية',
      'الثالثة',
      'الرابعة',
      'الخامسة',
      'السادسة',
      'السابعة',
      'الثامنة',
      'التاسعة',
      'العاشرة',
      'الحادية عشر',
      'الثانية عشر',
      'الثالثة عشر',
      'الرابعة عشر',
      'الخامسة عشر',
      'السادسة عشر',
      'السابعة عشر',
      'الثامنة عشر',
      'التاسعة عشر',
      'العشرون',
    ];
    return index < arabicOrdinals.length ? arabicOrdinals[index] : `${index + 1}`;
  };

  const findQuizForVideo = useCallback(
    (videoId: number | string) => {
      const videoIdNum = typeof videoId === 'string' ? parseInt(videoId, 10) : videoId;
      return quizzes.find((quiz) => quiz.videoId === videoIdNum) || null;
    },
    [quizzes],
  );

  const findAssignmentsForVideo = useCallback(
    (videoId: number | string) => {
      const videoIdNum = typeof videoId === 'string' ? parseInt(videoId, 10) : videoId;
      return assignments.filter((assignment) => assignment.videoId === videoIdNum);
    },
    [assignments],
  );

  const formatDuration = useCallback((totalSeconds: number) => {
    if (totalSeconds === 0) return '0 دقيقة';
    const totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
      return `${totalMinutes} دقيقة`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return `${hours} ساعة`;
    }
    return `${hours} ساعة و ${minutes} دقيقة`;
  }, []);

  const calculateCourseStats = useCallback(
    (courseArg: typeof course, quizzesArg: typeof quizzes) => {
      const totalDurationInSeconds =
        courseArg?.videos?.reduce((total: number, video: any) => total + (video.duration || 0), 0) ||
        0;
      const totalQuestionsCount = quizzesArg.reduce(
        (total, quiz) => total + (quiz.questionCount || 0),
        0,
      );
      setCourseDuration(formatDuration(totalDurationInSeconds));
      setTotalQuestions(totalQuestionsCount);
    },
    [formatDuration],
  );

  // Fetch quiz + assignment status per video.
  // NOTE: video progress is pre-hydrated from consolidated course fetch,
  // so we no longer dispatch `fetchVideoProgress` per video here.
  const checkVideoAndQuizStatus = useCallback(
    async (videoId: string | number) => {
      const quiz = findQuizForVideo(videoId);
      if (quiz) {
        dispatch(fetchQuizStatus(quiz.id));
      }
      const videoAssignments = findAssignmentsForVideo(videoId);
      if (videoAssignments.length > 0) {
        videoAssignments.forEach((assignment) => {
          dispatch(fetchAssignmentStatus(assignment.id));
        });
      }
    },
    [dispatch, findQuizForVideo, findAssignmentsForVideo],
  );

  const getVideoProgress = (videoId: string | number) => {
    return videoProgressMap[videoId] || { completed: false, watchedAt: null };
  };

  const getQuizStatus = (quizId: number) => {
    return quizStatusMap[quizId] || null;
  };

  const getAssignmentStatus = (assignmentId: number) => {
    return assignmentStatusMap[assignmentId] || null;
  };

  // ---- Data fetching ------------------------------------------------------

  // 1) Kick off consolidated course fetch (+ independent quizzes fetch) in parallel.
  useEffect(() => {
    dispatch(fetchCourseById(params.id));
    dispatch(fetchQuizzesByCourse(params.id));
  }, [params.id, dispatch]);

  // 2) Once `course.videos` is in Redux, fetch assignments and init accordion state.
  useEffect(() => {
    const videos = course?.videos;
    if (videos && videos.length > 0) {
      dispatch(
        fetchAssignmentsByCourse({
          courseId: params.id,
          videoIds: videos.map((v) => v.id),
        }),
      );
      const initialOpenState: Record<string, boolean> = {};
      for (const v of videos) initialOpenState[String(v.id)] = false;
      setOpenVideoIds(initialOpenState);
    }
  }, [course, params.id, dispatch]);

  // 3) Per-video status loop for quiz/assignment badges (progress already hydrated).
  useEffect(() => {
    const videos = course?.videos;
    if (videos && videos.length > 0 && isEnrolled) {
      videos.forEach((video: any) => {
        checkVideoAndQuizStatus(video.id);
      });
    }
  }, [course, isEnrolled, checkVideoAndQuizStatus]);

  // 4) Derived display stats.
  useEffect(() => {
    if (course) {
      calculateCourseStats(course, quizzes);
    }
  }, [course, quizzes, calculateCourseStats]);

  // ---- Render guards ------------------------------------------------------

  if (loading) return <div className="text-center p-8">جاري التحميل...</div>;
  if (error) return <div className="text-center p-8 text-red-500">خطأ: {error}</div>;
  if (!course)
    return <div className="text-center p-8">لا توجد بيانات متاحة للكورس</div>;

  // ---- JSX ----------------------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main Content - Left Side */}
        <div className="min-w-0 flex-1">
          {/* Course Header */}
          <div className="mb-8 rounded-lg bg-primary p-6 text-on-primary sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="mb-4 text-2xl font-bold leading-10 sm:text-3xl">
                  {course.title || 'كورس الأزهر المكثف المجاني'}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
                    + {course.files_count || 0} ملفات
                  </span>
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    + {course.videos?.length || 0} فيديوهات
                  </span>
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    + {quizzes.length || 0} امتحانات
                  </span>
                </div>
              </div>
              <div className="text-right sm:text-left">
                <p className="text-lg font-bold">
                  {course.price === 0 ? 'هذا الكورس مجاني !' : `السعر: ${course.price} جنيه`}
                </p>
                <p className="text-sm">
                  {course.description_short || 'الدورة لطلبة الأزهر فقط ❤️'}
                </p>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="overflow-hidden rounded-lg bg-white shadow-level-2">
            <h2 className="text-xl font-bold p-6 border-b dark:border-gray-700">
              محتوى الكورس
            </h2>
            <div className="space-y-2 p-3 sm:p-4">
              {course.videos && course.videos.length > 0 ? (
                course.videos.map((video: any, index: number) => {
                  const videoProgress = getVideoProgress(video.id);
                  const quiz = findQuizForVideo(video.id);
                  const quizStatus = quiz ? getQuizStatus(quiz.id) : null;

                  return (
                    <div
                      key={video.id}
                      className="overflow-hidden rounded-md border border-outline-variant/70 transition-colors"
                    >
                      <div
                        className="cursor-pointer p-5 transition-colors hover:bg-[#e8f2ff]/50"
                        onClick={() => toggleVideo(String(video.id))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-primary">
                              {openVideoIds[String(video.id)] ? (
                                <ChevronUp size={20} />
                              ) : (
                                <ChevronDown size={20} />
                              )}
                            </span>
                            <h3 className="text-lg font-semibold">
                              المحاضرة {getArabicOrdinal(index)}
                            </h3>

                            {videoProgress.completed && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs">
                                <CheckCircle size={12} className="text-green-600" />
                                <span>تم المشاهدة</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-on-surface-variant">
                              {video.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {openVideoIds[String(video.id)] && (
                        <div className="px-5 pb-5">
                          <div className="space-y-3">
                            {/* Video Card */}
                            <div className="flex flex-col gap-3 rounded-md bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2">
                                <Play
                                  size={16}
                                  className={
                                    videoProgress.completed
                                      ? 'text-green-600'
                                      : 'text-primary'
                                  }
                                />
                                <span className="font-medium">
                                  {video.description || 'شاهد هذه المحاضرة'}
                                </span>

                                {videoProgress.completed && (
                                  <span className="text-xs text-gray-500">
                                    تمت المشاهدة في{' '}
                                    {new Date(
                                      videoProgress.watchedAt || '',
                                    ).toLocaleDateString('ar-EG')}
                                  </span>
                                )}
                              </div>
                              {isEnrolled && (
                                <Link
                                  href={`/course/${params.id}/video/${video.id}`}
                                  className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                                >
                                  {videoProgress.completed ? (
                                    <>
                                      <Check size={16} />
                                      مشاهدة مرة أخرى
                                    </>
                                  ) : (
                                    <>
                                      <Play size={16} />
                                      شاهد المحاضرة من هنا
                                    </>
                                  )}
                                </Link>
                              )}
                            </div>

                            {/* Quiz Card - if there's a quiz for this video */}
                            {quiz && (
                              <div
                                className={`flex items-center justify-between p-3 rounded-md
                                ${
                                  quizStatus?.passed
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                    : quizStatus?.taken
                                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                                      : 'bg-gray-50 dark:bg-gray-700 border-gray-400'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {quizStatus?.passed ? (
                                    <Award size={16} className="text-green-600" />
                                  ) : quizStatus?.taken ? (
                                    <Clock size={16} className="text-red-500" />
                                  ) : (
                                    <Award size={16} className="text-gray-500" />
                                  )}
                                  <span className="font-medium">{quiz.title}</span>

                                  {quizStatus?.taken && (
                                    <span
                                      className={`text-xs ${
                                        quizStatus?.passed
                                          ? 'text-green-500'
                                          : 'text-red-500'
                                      }`}
                                    >
                                      {quizStatus?.passed
                                        ? `نجاح - ${quizStatus.score}%`
                                        : `رسوب - ${quizStatus.score}%`}
                                    </span>
                                  )}
                                </div>

                                {isEnrolled && videoProgress.completed && (
                                  <Link
                                    href={`/course/${params.id}/video/${video.id}/quiz/${quiz.id}`}
                                    className={`hover:underline text-sm flex items-center gap-1
                                      ${
                                        quizStatus?.passed
                                          ? 'text-green-600'
                                          : quizStatus?.taken
                                            ? 'text-red-500'
                                            : 'text-[#61B846]'
                                      }`}
                                  >
                                    {quizStatus?.passed ? (
                                      <>
                                        <Check size={16} />
                                        عرض النتيجة
                                      </>
                                    ) : quizStatus?.taken ? (
                                      <>
                                        <Clock size={16} />
                                        إعادة الاختبار
                                      </>
                                    ) : (
                                      <>
                                        <Award size={16} />
                                        بدء الاختبار
                                      </>
                                    )}
                                  </Link>
                                )}
                              </div>
                            )}

                            {/* Assignment Cards - if there are assignments for this video */}
                            {findAssignmentsForVideo(video.id).map((assignment) => {
                              const assignmentStatus = getAssignmentStatus(assignment.id);
                              const isPastDue =
                                new Date(assignment.dueDate) < new Date();
                              const isSubmitted = assignment.hasSubmitted;
                              const isGraded =
                                assignment.submission?.status === 'GRADED';

                              return (
                                <div
                                  key={assignment.id}
                                  className={`flex items-center justify-between p-3 rounded-md mt-2
                                    ${
                                      isGraded &&
                                      assignment.submission &&
                                      assignment.submission.grade >=
                                        assignment.passingScore
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                        : isGraded
                                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                                          : isSubmitted
                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                                            : isPastDue
                                              ? 'bg-gray-50 dark:bg-gray-700 border-red-400'
                                              : 'bg-gray-50 dark:bg-gray-700 border-blue-400'
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isGraded &&
                                    assignment.submission &&
                                    assignment.submission.grade >=
                                      assignment.passingScore ? (
                                      <CheckCircle size={16} className="text-green-600" />
                                    ) : isGraded ? (
                                      <Clock size={16} className="text-red-500" />
                                    ) : isSubmitted ? (
                                      <Clock size={16} className="text-yellow-500" />
                                    ) : isPastDue ? (
                                      <Clock size={16} className="text-red-400" />
                                    ) : (
                                      <Clock size={16} className="text-blue-400" />
                                    )}
                                    <span className="font-medium">{assignment.title}</span>

                                    {isGraded && assignment.submission && (
                                      <span
                                        className={`text-xs ${
                                          assignment.submission.grade >=
                                          assignment.passingScore
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                        }`}
                                      >
                                        {assignment.submission.grade >=
                                        assignment.passingScore
                                          ? `نجاح - ${assignment.submission.grade}/${assignment.passingScore}`
                                          : `رسوب - ${assignment.submission.grade}/${assignment.passingScore}`}
                                      </span>
                                    )}

                                    {!isGraded && isSubmitted && (
                                      <span className="text-xs text-yellow-500">
                                        قيد المراجعة
                                      </span>
                                    )}

                                    {!isSubmitted && isPastDue && (
                                      <span className="text-xs text-red-500">
                                        انتهى موعد التسليم
                                      </span>
                                    )}

                                    {!isSubmitted && !isPastDue && (
                                      <span className="text-xs text-blue-500">
                                        موعد التسليم:{' '}
                                        {new Date(
                                          assignment.dueDate,
                                        ).toLocaleDateString('ar-EG')}
                                      </span>
                                    )}
                                  </div>

                                  {isEnrolled && videoProgress.completed && (
                                    <Link
                                      href={`/course/${params.id}/video/${video.id}/assignment/${assignment.id}`}
                                      className={`hover:underline text-sm flex items-center gap-1
                                        ${
                                          isGraded &&
                                          assignment.submission &&
                                          assignment.submission.grade >=
                                            assignment.passingScore
                                            ? 'text-green-600'
                                            : isGraded
                                              ? 'text-red-500'
                                              : isSubmitted
                                                ? 'text-yellow-500'
                                                : isPastDue
                                                  ? 'text-red-400'
                                                  : 'text-blue-500'
                                        }`}
                                    >
                                      {isGraded ? (
                                        <>
                                          <Check size={16} />
                                          عرض النتيجة
                                        </>
                                      ) : isSubmitted ? (
                                        <>
                                          <Clock size={16} />
                                          عرض التسليم
                                        </>
                                      ) : isPastDue ? (
                                        <>
                                          <Clock size={16} />
                                          متأخر
                                        </>
                                      ) : (
                                        <>
                                          <Clock size={16} />
                                          بدء الواجب
                                        </>
                                      )}
                                    </Link>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-gray-500">
                  لا توجد محاضرات متاحة حالياً
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enrollment Card - Right Side */}
        <div className="shrink-0 lg:w-80">
          <EnrollmentCard
            courseId={params.id}
            isEnrolled={isEnrolled}
            courseTitle={course.title}
            coursePrice={course.price || 'مجاني'}
            courseDuration={courseDuration}
            questionsCount={totalQuestions.toString()}
            className="sticky top-24"
          />
        </div>
      </div>
    </div>
  );
}
