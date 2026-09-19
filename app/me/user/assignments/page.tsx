'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, XCircle, FileText, Clock, Award } from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  description: string;
  videoId: number;
  dueDate: string;
  isMCQ: boolean;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
  video: {
    id: number;
    title: string;
    courseId: number;
  };
}

interface Submission {
  id: number;
  userId: number;
  assignmentId: number;
  content: string | null;
  fileUrl: string | null;
  status: string;
  grade: number;
  feedback: string;
  submittedAt: string;
  gradedAt: string;
  mcqScore: number;
  assignment: Assignment;
}

import { apiClient } from '@/lib/api-client';
import { PageTitle } from '@/components/page-title';
import { withTeacher } from '@/lib/site-config';
import { PAGE_TITLES } from '@/lib/page-titles';

interface SubmissionsResponse {
  submissionsCount: number;
  submissions: Submission[];
}

export default function AssignmentsPage() {
  const [submissionsData, setSubmissionsData] = useState<SubmissionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async (signal?: AbortSignal) => {
    try {
      const data = await apiClient.get<any>('/assignments/user/submissions', { signal });
      if (Array.isArray(data)) {
        return { submissionsCount: data.length, submissions: data };
      }
      return data;
    } catch (err: any) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('تم إلغاء طلب جلب الواجبات');
        return null;
      }
      throw err;
    }
  };

  // Function to refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    setError(null);
    
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      const data = await fetchSubmissions(signal);
      if (data) {
        setSubmissionsData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الواجبات');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    const loadData = async () => {
      try {
        const data = await fetchSubmissions(signal);
        // تحقق مما إذا كان المكون لا يزال مثبتًا قبل تحديث الحالة
        if (isMounted && data) {
          setSubmissionsData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الواجبات');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    // Cleanup function to abort fetch if component unmounts
    return () => {
      isMounted = false;
      controller.abort('تم إلغاء التحميل بسبب إلغاء تثبيت المكون');
    };
  }, []);
  
  // No pagination needed
  
  // No skeleton loader needed
  

  if (isLoading) {
    return (
      <div className="account-page">
        <Card className="bg-white border-outline-variant text-on-surface mb-8 shadow-level-2">
          <CardHeader>
            <CardTitle className="text-center">
              <span className="text-primary-color">★</span> الواجبات المقدمة <span className="text-primary-color">★</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">جاري تحميل الواجبات...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-page">
        <Card className="bg-white border-outline-variant text-on-surface shadow-level-2">
          <CardHeader>
            <CardTitle className="text-center text-red-500">خطأ</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{error}</p>
            <Link href="/">
              <Button className="mt-4 bg-primary-color hover:bg-primary-hover text-white">العودة للصفحة الرئيسية</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!submissionsData || submissionsData.submissions?.length === 0) {
    return (
      <div className="account-page">
        <Card className="bg-white border-outline-variant text-on-surface shadow-level-2">
          <CardHeader>
            <CardTitle className="text-center">لا توجد واجبات مقدمة</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>لم يتم العثور على واجبات مقدمة</p>
            <Link href="/">
              <Button className="mt-4 bg-primary-color hover:bg-primary-hover text-white">العودة للصفحة الرئيسية</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SubmissionItem = ({ submission }: { submission: Submission }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Format date
    const formattedDate = new Date(submission.submittedAt).toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Description display logic
    const displayDescription = !submission.assignment.description ? '' :
      isExpanded ? submission.assignment.description :
      submission.assignment.description.length > 100 
        ? `${submission.assignment.description.substring(0, 100)}...` 
        : submission.assignment.description;
    
    return (
      <div className="border border-outline-variant rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-lg font-bold text-primary-color">{submission.assignment.title}</h4>
            <p className="text-on-surface-variant mt-1">{displayDescription}</p>
            {submission.assignment.description?.length > 100 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-primary-color text-sm mt-1 hover:underline"
              >
                {isExpanded ? 'عرض أقل' : 'عرض المزيد'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${submission.status === 'GRADED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {submission.status === 'GRADED' ? 'تم التقييم' : 'قيد المراجعة'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-surface-container-low p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-on-surface-variant" />
              <span className="text-on-surface-variant">تاريخ التقديم:</span>
            </div>
            <p>{formattedDate}</p>
          </div>
          
          {submission.status === 'GRADED' && (
            <div className="bg-surface-container-low p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary-color" />
                <span className="text-on-surface-variant">الدرجة:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary-color">{submission.grade}</span>
                <span className="text-on-surface-variant">/ 100</span>
                {submission.grade >= submission.assignment.passingScore ? (
                  <span className="bg-emerald-50 text-emerald-600 text-xs px-2 py-1 rounded-full ml-2">اجتياز</span>
                ) : (
                  <span className="bg-red-50 text-error text-xs px-2 py-1 rounded-full ml-2">لم يجتاز</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {submission.status === 'GRADED' && submission.feedback && (
          <div className="bg-surface-container-low p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-on-surface-variant" />
              <span className="text-on-surface-variant">ملاحظات المعلم:</span>
            </div>
            <p className="text-on-surface">{submission.feedback}</p>
          </div>
        )}
        
        {submission.assignment.isMCQ && submission.mcqScore !== null && (
          <div className="bg-primary-pale p-3 rounded-lg border border-primary-color/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary-color" />
              <span>درجة الاختيار من متعدد: </span>
              <span className="font-bold">{submission.mcqScore}%</span>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Link href={`/course/${submission.assignment.video.courseId}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">الذهاب للكورس</Button>
          </Link>
        </div>
      </div>
    );
  };
  
  // No pagination component needed

  // Main render function
  return (
    <div className="account-page">
      <PageTitle title={withTeacher(PAGE_TITLES.assignments)} />
      <Card className="bg-white border-outline-variant text-on-surface mb-8 shadow-level-2">
        <CardHeader>
          <CardTitle className="text-center">
            <span className="text-primary-color">★</span> الواجبات المقدمة <span className="text-primary-color">★</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-xl font-bold mb-2 md:mb-0">عدد الواجبات المقدمة: {submissionsData.submissionsCount}</h2>
            <Button 
              onClick={refreshData} 
              disabled={isRefreshing}
              className="bg-primary-color hover:bg-primary-hover text-white flex items-center gap-2"
            >
              <span>تحديث البيانات</span>
            </Button>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b border-outline-variant pb-2">تفاصيل الواجبات</h3>
            
            {submissionsData.submissions?.map((submission) => (
              <SubmissionItem key={submission.id} submission={submission} />
            ))}
            
            {/* No pagination controls needed */}
          </div>

          <div className="flex justify-center mt-8">
            <Link href="/me/user">
              <Button className="bg-primary-color hover:bg-primary-hover text-white">العودة لملف المستخدم</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
