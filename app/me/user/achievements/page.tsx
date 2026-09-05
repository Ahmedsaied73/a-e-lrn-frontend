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
        <div className="bg-blue-500 rounded-full p-3 mb-2">
          <Trophy className="text-white h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">انجازاتي</h1>
      </div>

      {/* Back to profile */}
      <div className="mb-6">
        <Link href="/me/user">
          <Button variant="outline" className="text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة إلى ملف المستخدم
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-white text-xl">جاري تحميل الانجازات...</div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-xl text-red-400">حدث خطأ</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      ) : !data || data.courses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-white">لا توجد انجازات بعد</p>
          <p className="text-gray-400 mt-2">اشترك في الكورسات وشاهد الدروس وحل الاختبارات لبدء تجميع انجازاتك</p>
        </div>
      ) : (
        <>
          {/* ── Summary tiles ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 text-center">
              <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">كورسات مشترك بها</p>
              <p className="text-2xl font-bold text-white">{totals?.coursesEnrolled ?? 0}</p>
              <p className="text-xs text-emerald-400 mt-1">منها {totals?.coursesCompleted ?? 0} مكتملة</p>
            </div>
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 text-center">
              <Video className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">فيديوهات شاهدتها</p>
              <p className="text-2xl font-bold text-white">
                {totals?.videosWatched ?? 0} <span className="text-sm text-gray-400">من {totals?.videosTotal ?? 0}</span>
              </p>
            </div>
            <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 text-center">
              <FileQuestion className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">اختبارات حليتها</p>
              <p className="text-2xl font-bold text-white">{totals?.examsTaken ?? 0}</p>
              <p className="text-xs text-emerald-400 mt-1">اجتزت {totals?.examsPassed ?? 0} منها</p>
            </div>
            <div className="col-span-2 md:col-span-3 bg-[#111827] border border-[#1f2937] rounded-2xl p-5 text-center">
              <Award className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">متوسط درجاتك في الاختبارات</p>
              <p className="text-3xl font-bold text-amber-400">{totals?.averageScore != null ? formatPercent(totals.averageScore) : '—'}</p>
            </div>
          </div>

          {/* ── Per-course achievement cards ── */}
          {data.courses.map((entry) => (
            <Card key={entry.course.id} className="bg-[#111827] border-[#1f2937] text-white mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="flex items-center gap-2 text-blue-400">
                    <GraduationCap className="h-5 w-5" />
                    <Link href={`/course/${entry.course.id}`} className="hover:underline">
                      {entry.course.title}
                    </Link>
                  </span>
                  {entry.course.grade && (
                    <span className="text-xs font-semibold text-gray-400">الصف: {entry.course.grade}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Course progress bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-300">
                      الفيديوهات: {entry.progress.watched} من {entry.progress.total}
                    </span>
                    <span className={entry.progress.completed ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {formatPercent(entry.progress.percent)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${entry.progress.completed ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: formatPercent(entry.progress.percent) }}
                    />
                  </div>
                  {entry.progress.completed && (
                    <p className="text-xs text-emerald-400 mt-2 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> تم إكمال الدورة بنجاح
                    </p>
                  )}
                </div>

                {/* Exam results */}
                {entry.exams.length > 0 ? (
                  <div className="divide-y divide-gray-800 border-t border-gray-800">
                    {entry.exams.map((exam) => (
                      <div key={exam.quizId} className="flex items-center justify-between gap-3 py-3 flex-wrap">
                        <div>
                          <p className="text-sm font-bold text-white">{exam.quizTitle}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            نسبة النجاح {exam.passingScore}% — المحاولات {exam.attemptsUsed} من {exam.maxAttempts}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {exam.passed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
                              <Star className="w-3.5 h-3.5" /> ناجح
                            </span>
                          ) : exam.bestScore != null ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
                              لم يُجتز بعد
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-gray-500">لم يُحل بعد</span>
                          )}
                          <Link
                            href={`/course/${entry.course.id}/video/${exam.videoId}/quiz`}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300"
                          >
                            فتح الاختبار
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">لا توجد اختبارات في هذه الدورة.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}