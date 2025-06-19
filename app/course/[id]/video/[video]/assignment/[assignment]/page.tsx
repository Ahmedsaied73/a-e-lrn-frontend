'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Upload } from 'lucide-react';
import Link from 'next/link';
import { AppDispatch } from '@/store/store';
import {
  fetchAssignmentById,
  submitAssignment,
  setSelectedAnswer,
  selectCurrentAssignment,
  selectSelectedAnswers,
  selectAssignmentResults,
  resetAssignmentState
} from '@/store/slices/assignmentSlice';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Assignment Results Dialog Component
interface AssignmentResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentResults: any | null;
  courseId: string;
}

function AssignmentResultsDialog({ open, onOpenChange, assignmentResults, courseId }: AssignmentResultsDialogProps) {
  const router = useRouter();

  const handleViewResults = () => {
    if (assignmentResults) {
      router.push(`/me/user/assignment-results?assignmentId=${assignmentResults.assignmentId}`);
    }
  };

  const handleReturnToCourse = () => {
    router.push(`/course/${courseId}`);
  };

  if (!assignmentResults) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111827] border-[#1f2937] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            <span className="text-blue-400">★</span> نتيجة الواجب <span className="text-blue-400">★</span>
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            لقد تم تقديم الواجب بنجاح
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center py-4">
          {assignmentResults.mcqScore !== undefined && (
            <div className="mb-4">
              <span className="text-2xl font-bold text-blue-400">{assignmentResults.mcqScore}%</span>
              <p className="text-sm text-gray-400 mt-1">
                {assignmentResults.passed ? (
                  <span className="text-green-400">لقد اجتزت الواجب بنجاح!</span>
                ) : (
                  <span className="text-red-400">لم تجتز الواجب. حاول مرة أخرى!</span>
                )}
              </p>
            </div>
          )}
          
          {assignmentResults.status === 'PENDING' && (
            <div className="mb-4">
              <p className="text-yellow-400 text-lg">تم تقديم الواجب وهو قيد المراجعة</p>
              <p className="text-sm text-gray-400 mt-1">سيتم إشعارك عند الانتهاء من تقييم الواجب</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          {assignmentResults.mcqScore !== undefined && (
            <Button
              onClick={handleViewResults}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
            >
              عرض النتيجة التفصيلية
            </Button>
          )}
          <Button
            onClick={handleReturnToCourse}
            className="bg-[#61B846] hover:bg-[#61B846]/90 flex-1"
          >
            الرجوع للكورس
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const assignmentId = Number(params.assignment);
  const courseId = params.id as string;
  const videoId = params.video as string;
  
  const assignment = useSelector(selectCurrentAssignment);
  const selectedAnswers = useSelector(selectSelectedAnswers);
  const assignmentResults = useSelector(selectAssignmentResults);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // For regular assignments
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const loadAssignment = async () => {
      try {
        setIsLoading(true);
        await dispatch(fetchAssignmentById(assignmentId)).unwrap();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الواجب');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Reset assignment state when component mounts
    dispatch(resetAssignmentState());
    loadAssignment();
    
    // Cleanup when component unmounts
    return () => {
      dispatch(resetAssignmentState());
    };
  }, [dispatch, assignmentId]);
  
  const handleOptionSelect = (questionId: number, optionId: number) => {
    dispatch(setSelectedAnswer({ questionId, optionId }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a temporary URL for the file preview only
      const tempUrl = URL.createObjectURL(selectedFile);
      setFileUrl(tempUrl);
    }
  };
  
  const handleSubmit = async () => {
    if (!assignment) return;
    
    if (assignment.isMCQ) {
      // تحقق أن كل سؤال تمت الإجابة عليه فعلاً (القيمة ليست null أو undefined أو فارغة)
      const unansweredQuestions = assignment.AssignmentQuestion?.filter(q => selectedAnswers[q.id] == undefined || selectedAnswers[q.id] == null);
      if (unansweredQuestions && unansweredQuestions.length > 0) {
        setError(`يرجى الإجابة على جميع الأسئلة. (${unansweredQuestions.length} سؤال متبقي)`);
        return;
      }
    } else {
      // للواجبات العادية، تحقق من وجود محتوى أو ملف
      if (!content && !file) {
        setError('يرجى إدخال محتوى أو تحميل ملف للواجب');
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (assignment.isMCQ) {
        // Format answers for MCQ submission
        const answers = Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
          questionId: Number(questionId),
          selectedOption: optionId
        }));
        
        await dispatch(submitAssignment({ assignmentId, answers })).unwrap();
      } else {
        // Submit regular assignment
        // إذا كان هناك ملف، قم بتحميله أولاً ثم أرسل الرابط
        let fileUrlToSubmit = null;
        
        if (file) {
          // هنا يمكن إضافة كود لتحميل الملف إلى الخادم والحصول على رابط حقيقي
          // مثال: استخدام FormData لتحميل الملف
          const formData = new FormData();
          formData.append('file', file);
          
          // يمكن إضافة كود لتحميل الملف هنا واستلام الرابط من الخادم
          // لكن في هذه الحالة سنكتفي بإرسال المحتوى النصي فقط
          
          // fileUrlToSubmit = response.fileUrl; // الرابط المستلم من الخادم بعد التحميل
        }
        
        await dispatch(submitAssignment({ 
          assignmentId, 
          content, 
        //   fileUrl: fileUrlToSubmit // إرسال الرابط الحقيقي أو null
        })).unwrap();
      }
      
      setShowResults(true);
    } catch (err) {
      // Check if the error message includes status code
      const errorMsg = typeof err === 'string' ? err : err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الواجب';
      
      if (errorMsg.startsWith('STATUS_400:')) {
        // 400 Bad Request - Assignment already submitted
        setError('لقد قمت بتقديم هذا الواجب بالفعل');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-white">جاري تحميل الواجب...</p>
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
            <Link href={`/course/${courseId}/video/${videoId}`}>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">العودة للفيديو</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!assignment) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="bg-[#111827] border-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-center">الواجب غير متوفر</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>لم يتم العثور على الواجب المطلوب</p>
            <Link href={`/course/${courseId}/video/${videoId}`}>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">العودة للفيديو</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Check if assignment is past due date
  const isPastDue = new Date(assignment.dueDate) < new Date();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="bg-[#111827] border-[#1f2937] text-white mb-8">
        <CardHeader>
          <CardTitle className="text-center text-xl md:text-2xl">
            <span className="text-blue-400">★</span> {assignment.title} <span className="text-blue-400">★</span>
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {assignment.description}
          </CardDescription>
          <div className="text-center mt-2">
            <span className="text-yellow-400 text-sm">
              تاريخ التسليم: {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
              {isPastDue && <span className="text-red-500 mr-2">(انتهى موعد التسليم)</span>}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-md mb-6 text-center">
              {error}
            </div>
          )}
          
          {isPastDue && !assignment.hasSubmitted && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 p-4 rounded-md mb-6 text-center">
              انتهى موعد تسليم هذا الواجب. يمكنك المحاولة ولكن قد لا يتم احتساب درجتك.
            </div>
          )}
          
          {assignment.isMCQ ? (
            // MCQ Assignment
            <div className="space-y-8">
              {assignment.AssignmentQuestion?.map((question, index) => (
                <div key={question.id} className="border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{question.text}</span>
                  </h3>
                  
                  <RadioGroup
                    value={selectedAnswers[question.id]?.toString() || ''}
                    className="space-y-3 mt-4"
                  >
                    {Array.isArray(question.options) && question.options.map((option, optIndex) => {
                      // Handle both string options and object options
                      const optionId = typeof option === 'string' ? optIndex : option.id;
                      const optionText = typeof option === 'string' ? option : option.text;
                      
                      return (
                        <div key={optionId} className="flex items-start space-x-2 space-x-reverse">
                          <RadioGroupItem
                            value={optionId.toString()}
                            id={`q${question.id}-opt${optionId}`}
                            onClick={() => handleOptionSelect(question.id, optionId)}
                            className="mt-1"
                          />
                          <Label
                            htmlFor={`q${question.id}-opt${optionId}`}
                            className="flex-1 cursor-pointer py-2 px-3 rounded-md hover:bg-gray-800"
                          >
                            {optionText}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </div>
          ) : (
            // Regular Assignment
            <div className="space-y-6">
              <div>
                <Label htmlFor="assignment-content" className="text-lg font-medium mb-2 block">
                  محتوى الواجب
                </Label>
                <Textarea
                  id="assignment-content"
                  placeholder="اكتب محتوى الواجب هنا..."
                  className="min-h-[200px] bg-gray-800 border-gray-700 text-white"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="assignment-file" className="text-lg font-medium mb-2 block">
                  تحميل ملف (اختياري)
                </Label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                  {fileUrl ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="text-green-500">تم تحميل الملف بنجاح</p>
                      <p className="text-sm text-gray-400">{file?.name}</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          setFile(null);
                          setFileUrl(null);
                        }}
                      >
                        إزالة الملف
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-gray-400">اسحب وأفلت الملف هنا أو انقر للتصفح</p>
                      <Input
                        id="assignment-file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => document.getElementById('assignment-file')?.click()}
                      >
                        تصفح الملفات
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (assignment.hasSubmitted && !assignment.isMCQ)}
            className="bg-[#61B846] hover:bg-[#61B846]/90 text-white px-8 py-2 text-lg"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-2"></span>
                جاري الإرسال...
              </>
            ) : assignment.hasSubmitted && !assignment.isMCQ ? (
              'تم تقديم الواجب بالفعل'
            ) : (
              'إرسال الواجب'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Results Dialog */}
      <AssignmentResultsDialog 
        open={showResults} 
        onOpenChange={setShowResults} 
        assignmentResults={assignmentResults} 
        courseId={courseId} 
      />
    </div>
  );
}