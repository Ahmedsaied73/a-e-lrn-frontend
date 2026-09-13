'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, BookOpen, Video, FileQuestion, Award, Star, GraduationCap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAchievements } from '@/services/achievementsService';
import type { AchievementsData } from '@/types/quiz';

function formatPercent(percent: number): string {
  const clamped = Math.min(100, Math.max(0, percent));
  return `${clamped}%`;
}

export default function UserAchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const result = await getAchievements();
        setData(result);
      } catch (err: any) {
        console.error('خطأ في جلب الانجازات:', err);
        setError(err.message || 'حدث خطأ أثناء جلب الانجازات');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const totals = data?.totals;

  return (
    <div className="account-page">
      {/* Header */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="bg-primary-color rounded-full p-3 mb-2">
          <Trophy className="text-white h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface text-center">انجازاتي</h1>
      </div>

      {/* Back to profile */}
      <div className="mb-6">
        <Link href="/me/user">
          <Button variant="outline" className="text-on-surface border-outline-variant bg-white hover:bg-surface-container-low">
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة إلى ملف المستخدم
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-on-surface text-xl">جاري تحميل الانجازات...</div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-xl text-error">حدث خطأ</p>
          <p className="text-on-surface-variant mt-2">{error}</p>
        </div>
      ) : !data || data.courses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-on-surface">لا توجد انجازات بعد</p>
          <p className="text-on-surface-variant mt-2">اشترك في الكورسات وشاهد الدروس وحل الاختبارات لبدء تجميع انجازاتك</p>
        </div>
      ) : (
        <>
          {/* ── Summary tiles ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-outline-variant rounded-2xl p-5 text-center">
              <BookOpen className="w-6 h-6 text-primary-color mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant mb-1">كورسات مشترك بها</p>
              <p className="text-2xl font-bold text-on-surface">{totals?.coursesEnrolled ?? 0}</p>
              <p className="text-xs text-emerald-600 mt-1">منها {totals?.coursesCompleted ?? 0} مكتملة</p>
            </div>
            <div className="bg-white border border-outline-variant rounded-2xl p-5 text-center">
              <Video className="w-6 h-6 text-cyan-600 mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant mb-1">فيديوهات شاهدتها</p>
              <p className="text-2xl font-bold text-on-surface">
                {totals?.videosWatched ?? 0} <span className="text-sm text-on-surface-variant">من {totals?.videosTotal ?? 0}</span>
              </p>
            </div>
            <div className="bg-white border border-outline-variant rounded-2xl p-5 text-center">
              <FileQuestion className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant mb-1">اختبارات حليتها</p>
              <p className="text-2xl font-bold text-on-surface">{totals?.examsTaken ?? 0}</p>
              <p className="text-xs text-emerald-600 mt-1">اجتزت {totals?.examsPassed ?? 0} منها</p>
            </div>
            <div className="col-span-2 md:col-span-3 bg-white border border-outline-variant rounded-2xl p-5 text-center">
              <Award className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant mb-1">متوسط درجاتك في الاختبارات</p>
              <p className="text-3xl font-bold text-amber-600">{totals?.averageScore != null ? formatPercent(totals.averageScore) : '—'}</p>
            </div>
          </div>

          {/* ── Per-course achievement cards ── */}
          {data.courses.map((entry) => (
            <Card key={entry.course.id} className="bg-white border-outline-variant text-on-surface mb-8 shadow-level-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="flex items-center gap-2 text-primary-color">
                    <GraduationCap className="h-5 w-5" />
                    <Link href={`/course/${entry.course.id}`} className="hover:underline">
                      {entry.course.title}
                    </Link>
                  </span>
                  {entry.course.grade && (
                    <span className="text-xs font-semibold text-on-surface-variant">الصف: {entry.course.grade}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Course progress bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-on-surface-variant">
                      الفيديوهات: {entry.progress.watched} من {entry.progress.total}
                    </span>
                    <span className={entry.progress.completed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                      {formatPercent(entry.progress.percent)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${entry.progress.completed ? "bg-emerald-600" : "bg-primary-color"}`}
                      style={{ width: formatPercent(entry.progress.percent) }}
                    />
                  </div>
                  {entry.progress.completed && (
                    <p className="text-xs text-emerald-600 mt-2 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> تم إكمال الدورة بنجاح
                    </p>
                  )}
                </div>

                {/* Exam results */}
                {entry.exams.length > 0 ? (
                  <div className="divide-y divide-outline-variant border-t border-outline-variant">
                    {entry.exams.map((exam) => (
                      <div key={exam.quizId} className="flex items-center justify-between gap-3 py-3 flex-wrap">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{exam.quizTitle}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            نسبة النجاح {exam.passingScore}% — المحاولات {exam.attemptsUsed} من {exam.maxAttempts}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {exam.passed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                              <Star className="w-3.5 h-3.5" /> ناجح
                            </span>
                          ) : exam.bestScore != null ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                              لم يُجتز بعد
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-on-surface-variant/60">لم يُحل بعد</span>
                          )}
                          <Link
                            href={`/course/${entry.course.id}/video/${exam.videoId}/quiz`}
                            className="text-xs font-bold text-primary-color hover:text-blue-300"
                          >
                            فتح الاختبار
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant/60">لا توجد اختبارات في هذه الدورة.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
