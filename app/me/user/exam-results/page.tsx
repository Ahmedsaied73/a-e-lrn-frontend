'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { fetchQuizResults } from '@/services/quizService';

export default function ExamResultsPage() {
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');
  
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!quizId) {
        setError('معرف الاختبار غير متوفر');
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchQuizResults(Number(quizId));
        setResults(data);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء جلب النتائج');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [quizId]);

  if (isLoading) {
    return (
      <div className="account-page flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-white">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-page">
        <Card className="bg-[#111827] border-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-center text-red-500">خطأ</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{error}</p>
            <Link href="/">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">العودة للصفحة الرئيسية</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="account-page">
        <Card className="bg-[#111827] border-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-center">لا توجد نتائج</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>لم يتم العثور على نتائج لهذا الاختبار</p>
            <Link href="/">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">العودة للصفحة الرئيسية</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="account-page">
      <Card className="bg-[#111827] border-[#1f2937] text-white mb-8">
        <CardHeader>
          <CardTitle className="text-center">
            <span className="text-blue-400">★</span> نتائج الاختبار <span className="text-blue-400">★</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">{results.quizTitle || 'اختبار'}</h2>
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg">
                <span className="font-bold text-2xl">{results.score || 0}</span>
                <span className="text-sm"> / {results.totalScore || 0}</span>
              </div>
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">
                <span className="font-bold text-2xl">{results.correctAnswers || 0}</span>
                <span className="text-sm"> إجابات صحيحة</span>
              </div>
              <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg">
                <span className="font-bold text-2xl">{results.wrongAnswers || 0}</span>
                <span className="text-sm"> إجابات خاطئة</span>
              </div>
            </div>
            <div className="text-lg">
              النسبة المئوية: <span className="font-bold text-blue-400">{results.percentage || 0}%</span>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">تفاصيل الإجابات</h3>
            
            {results.questions && results.questions.map((question: any, index: number) => (
              <div key={question.id || index} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  {question.isCorrect ? (
                    <CheckCircle className="text-green-500 h-5 w-5 mt-1 flex-shrink-0" />
                  ) : (
                    <XCircle className="text-red-500 h-5 w-5 mt-1 flex-shrink-0" />
                  )}
                  <h4 className="text-md font-medium">{question.text || `سؤال ${index + 1}`}</h4>
                </div>
                
                <div className="ml-7 space-y-2">
                  {question.options && question.options.map((option: any, optIndex: number) => (
                    <div 
                      key={optIndex} 
                      className={`p-2 rounded-md ${option.id === question.selectedOption ? 
                        (option.id === question.correctOption ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50') : 
                        option.id === question.correctOption ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-gray-800'}`}
                    >
                      <div className="flex items-center gap-2">
                        {option.id === question.selectedOption && option.id === question.correctOption && (
                          <CheckCircle className="text-green-500 h-4 w-4 flex-shrink-0" />
                        )}
                        {option.id === question.selectedOption && option.id !== question.correctOption && (
                          <XCircle className="text-red-500 h-4 w-4 flex-shrink-0" />
                        )}
                        <span>{option.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8 gap-4">
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">العودة للصفحة الرئيسية</Button>
            </Link>
            <Link href={`/course/${results.courseId || ''}`}>
              <Button className="bg-[#61B846] hover:bg-[#61B846]/90">العودة للكورس</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
