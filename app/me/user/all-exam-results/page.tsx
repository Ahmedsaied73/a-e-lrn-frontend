'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, BookOpen, Calendar, Clock, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuizResult {
  quizId: number;
  title: string;
  description: string;
  isFinal: boolean;
  passingScore: number;
  courseId: number;
  courseTitle: string;
  videoId: number | null;
  videoTitle: string | null;
  submittedAt: string;
  correctAnswers: number;
  totalQuestions: number;
  earnedPoints: number;
  totalPoints: number;
  score: number;
  passed: boolean;
  answers: Answer[];
}

interface Answer {
  questionId: number;
  questionText: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  points: number;
  explanation: string;
}

interface ApiResponse {
  message: string;
  count: number;
  results: QuizResult[];
}

export default function AllExamResultsPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  useEffect(() => {
    const fetchAllResults = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        setError('يرجى تسجيل الدخول أولاً');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3005/quizzes/user/results', {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });

        // Handle 404 specifically for "No quiz results found" message
        if (response.status === 404) {
          const data = await response.json();
          if (data.message === "No quiz results found") {
            // Set empty results but don't set an error
            setResults([]);
            setFilteredResults([]);
            setIsLoading(false);
            return;
          }
        }
        
        if (!response.ok) {
          throw new Error('فشل في جلب نتائج الاختبارات');
        }

        const data: ApiResponse = await response.json();
        setResults(data.results);
        setFilteredResults(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النتائج');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllResults();
  }, []);

  useEffect(() => {
    // تطبيق البحث والتصفية على النتائج
    let filtered = [...results];
    
    // تطبيق البحث
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // تطبيق التصفية
    if (filterType === 'passed') {
      filtered = filtered.filter(result => result.passed);
    } else if (filterType === 'failed') {
      filtered = filtered.filter(result => !result.passed);
    } else if (filterType === 'final') {
      filtered = filtered.filter(result => result.isFinal);
    }
    
    setFilteredResults(filtered);
  }, [searchTerm, filterType, results]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-white">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="bg-[#111827] border-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-center text-red-500">خطأ</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{error}</p>
            <Link href="/me/user">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">العودة لملف المستخدم</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if there are no results but no error (meaning the API returned successfully with no results)
  if (results.length === 0 && !error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-blue-500 rounded-full p-3 mb-2">
            <CheckCircle className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">نتائج جميع الاختبارات</h1>
        </div>
        
        <Card className="bg-[#111827] border-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-center">لا توجد نتائج اختبارات</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-6">
              <BookOpen className="h-16 w-16 text-blue-400 opacity-70" />
            </div>
            <p className="text-lg mb-4">لم تقم بإجراء أي اختبارات بعد</p>
            <p className="text-gray-400 mb-6">عندما تقوم بإجراء اختبارات في الكورسات، ستظهر نتائجك هنا</p>
            <Link href="/me/user">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">العودة لملف المستخدم</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="bg-blue-500 rounded-full p-3 mb-2">
          <CheckCircle className="text-white h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">نتائج جميع الاختبارات</h1>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card className="bg-[#111827] border-[#1f2937] text-white mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ابحث عن اختبار..."
                className="pl-10 bg-[#1f2937] border-[#374151] text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-[#1f2937] border-[#374151] text-white">
                  <SelectValue placeholder="تصفية النتائج" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] border-[#374151] text-white">
                  <SelectItem value="all">جميع النتائج</SelectItem>
                  <SelectItem value="passed">الاختبارات الناجحة</SelectItem>
                  <SelectItem value="failed">الاختبارات غير الناجحة</SelectItem>
                  <SelectItem value="final">الاختبارات النهائية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-left md:text-right">
              <Badge className="bg-blue-500 hover:bg-blue-600">
                إجمالي الاختبارات: {filteredResults.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* عرض النتائج */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1f2937] mb-6">
          <TabsTrigger value="cards" className="data-[state=active]:bg-blue-600">عرض البطاقات</TabsTrigger>
          <TabsTrigger value="table" className="data-[state=active]:bg-blue-600">عرض الجدول</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards" className="mt-0">
          {filteredResults.length === 0 ? (
            <Card className="bg-[#111827] border-[#1f2937] text-white">
              <CardContent className="pt-6 text-center">
                <p>لا توجد نتائج متطابقة مع معايير البحث</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map((result) => (
                <Card key={result.quizId} className="bg-[#111827] border-[#1f2937] text-white overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`h-2 w-full ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{result.title}</CardTitle>
                      <Badge className={result.passed ? 'bg-green-500' : 'bg-red-500'}>
                        {result.passed ? 'ناجح' : 'غير ناجح'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{result.courseTitle}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-500/20 text-blue-400 p-2 rounded-full">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span>الدرجة</span>
                        </div>
                        <div className="text-xl font-bold">
                          {result.score}%
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-500/20 text-green-400 p-2 rounded-full">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span>الإجابات الصحيحة</span>
                        </div>
                        <div>
                          {result.correctAnswers} / {result.totalQuestions}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-500/20 text-purple-400 p-2 rounded-full">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <span>النقاط المكتسبة</span>
                        </div>
                        <div>
                          {result.earnedPoints} / {result.totalPoints}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="bg-orange-500/20 text-orange-400 p-2 rounded-full">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <span>تاريخ التقديم</span>
                        </div>
                        <div className="text-sm">
                          {formatDate(result.submittedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Link href={`/me/user/exam-results?quizId=${result.quizId}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">عرض التفاصيل</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="table" className="mt-0">
          <Card className="bg-[#111827] border-[#1f2937] text-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1f2937]">
                    <th className="px-4 py-3 text-right">عنوان الاختبار</th>
                    <th className="px-4 py-3 text-right">الكورس</th>
                    <th className="px-4 py-3 text-right">الدرجة</th>
                    <th className="px-4 py-3 text-right">الإجابات الصحيحة</th>
                    <th className="px-4 py-3 text-right">النتيجة</th>
                    <th className="px-4 py-3 text-right">التاريخ</th>
                    <th className="px-4 py-3 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center">لا توجد نتائج متطابقة مع معايير البحث</td>
                    </tr>
                  ) : (
                    filteredResults.map((result) => (
                      <tr key={result.quizId} className="border-t border-[#374151] hover:bg-[#1f2937]/50">
                        <td className="px-4 py-3">{result.title}</td>
                        <td className="px-4 py-3">{result.courseTitle}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${result.score >= result.passingScore ? 'text-green-400' : 'text-red-400'}`}>
                            {result.score}%
                          </span>
                        </td>
                        <td className="px-4 py-3">{result.correctAnswers} / {result.totalQuestions}</td>
                        <td className="px-4 py-3">
                          <Badge className={result.passed ? 'bg-green-500' : 'bg-red-500'}>
                            {result.passed ? 'ناجح' : 'غير ناجح'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDate(result.submittedAt)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/me/user/exam-results?quizId=${result.quizId}`}>
                            <Button size="sm" variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white">
                              التفاصيل
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* إحصائيات موجزة */}
      <Card className="bg-[#111827] border-[#1f2937] text-white mt-8">
        <CardHeader>
          <CardTitle className="text-center">
            <span className="text-blue-400">★</span> ملخص الأداء <span className="text-blue-400">★</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1f2937] p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {results.length}
              </div>
              <div className="text-gray-400">إجمالي الاختبارات</div>
            </div>
            
            <div className="bg-[#1f2937] p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {results.filter(r => r.passed).length}
              </div>
              <div className="text-gray-400">الاختبارات الناجحة</div>
            </div>
            
            <div className="bg-[#1f2937] p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">
                {results.filter(r => !r.passed).length}
              </div>
              <div className="text-gray-400">الاختبارات غير الناجحة</div>
            </div>
            
            <div className="bg-[#1f2937] p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0}%
              </div>
              <div className="text-gray-400">متوسط الدرجات</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-8">
        <Link href="/me/user">
          <Button className="bg-blue-600 hover:bg-blue-700">العودة لملف المستخدم</Button>
        </Link>
      </div>
    </div>
  );
}