'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import QuizResultsDialog from '@/components/QuizResultsDialog';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { AppDispatch } from '@/store/store';
import {
  fetchQuizById,
  submitQuizAnswers,
  setSelectedAnswer,
  selectCurrentQuiz,
  selectSelectedAnswers,
  selectQuizResults,
  resetQuizState
} from '@/store/slices/quizSlice';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const quizId = Number(params.quiz);
  const courseId = params.id as string;
  const videoId = params.video as string;
  
  const quiz = useSelector(selectCurrentQuiz);
  const selectedAnswers = useSelector(selectSelectedAnswers);
  const quizResults = useSelector(selectQuizResults);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setIsLoading(true);
        await dispatch(fetchQuizById(quizId)).unwrap();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الاختبار');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Reset quiz state when component mounts
    dispatch(resetQuizState());
    loadQuiz();
    
    // Cleanup when component unmounts
    return () => {
      dispatch(resetQuizState());
    };
  }, [dispatch, quizId]);
  
  const handleOptionSelect = (questionId: number, optionId: number) => {
    dispatch(setSelectedAnswer({ questionId, optionId }));
  };
  
  const handleSubmit = async () => {
    if (!quiz) return;
    // تحقق أن كل سؤال تمت الإجابة عليه فعلاً (القيمة ليست null أو undefined أو فارغة)
    const unansweredQuestions = quiz.questions?.filter(q => selectedAnswers[q.id] == undefined || selectedAnswers[q.id] == null);
    if (unansweredQuestions && unansweredQuestions.length > 0) {
      setError(`يرجى الإجابة على جميع الأسئلة. (${unansweredQuestions.length} سؤال متبقي)`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Format answers for submission
      const answers = Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
        questionId: Number(questionId),
        selectedOption: optionId
      }));
      
      await dispatch(submitQuizAnswers({ quizId, answers })).unwrap();
      setShowResults(true);
    } catch (err) {
      // Check if the error message includes status code
      const errorMsg = typeof err === 'string' ? err : err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الإجابات';
      
      if (errorMsg.startsWith('STATUS_400:')) {
        // 400 Bad Request - Quiz already completed
        setError('لقد أجتزت هذا الاختبار بالفعل');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleViewResults = () => {
    router.push(`/me/user/exam-results?quizId=${quizId}`);
  };
  
  const handleReturnToCourse = () => {
    router.push(`/course/${courseId}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-white">جاري تحميل الاختبار...</p>
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
  
  if (!quiz) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="bg-[#111827] border-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-center">الاختبار غير متوفر</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>لم يتم العثور على الاختبار المطلوب</p>
            <Link href={`/course/${courseId}/video/${videoId}`}>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">العودة للفيديو</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="bg-[#111827] border-[#1f2937] text-white mb-8">
        <CardHeader>
          <CardTitle className="text-center text-xl md:text-2xl">
            <span className="text-blue-400">★</span> {quiz.title} <span className="text-blue-400">★</span>
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {quiz.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-md mb-6 text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-8">
            {quiz.questions?.map((question, index) => (
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
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#61B846] hover:bg-[#61B846]/90 text-white px-8 py-2 text-lg"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-2"></span>
                جاري الإرسال...
              </>
            ) : (
              'إرسال الإجابات'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Results Dialog */}
      <QuizResultsDialog 
        open={showResults} 
        onOpenChange={setShowResults} 
        quizResults={quizResults} 
        courseId={courseId} 
      />
    </div>
  );
}