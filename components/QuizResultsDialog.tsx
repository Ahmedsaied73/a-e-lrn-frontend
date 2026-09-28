'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuizResult } from '@/store/slices/quizSlice';

interface QuizResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizResults: QuizResult | null;
  courseId: string;
}

export default function QuizResultsDialog({ open, onOpenChange, quizResults, courseId }: QuizResultsDialogProps) {
  const router = useRouter();

  const handleViewResults = () => {
    if (quizResults) {
      router.push(`/me/user/exam-results?quizId=${quizResults.quizId}`);
    }
  };

  const handleReturnToCourse = () => {
    router.push(`/course/${courseId}`);
  };

  if (!quizResults) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111827] border-[#1f2937] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            <span className="text-blue-400">★</span> نتيجة الاختبار <span className="text-blue-400">★</span>
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            لقد أكملت الاختبار بنجاح
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center py-4">
          <div className="mb-4">
            <span className="text-2xl font-bold text-blue-400">{quizResults.score}%</span>
            <p className="text-sm text-gray-400 mt-1">
              {quizResults.passed ? (
                <span className="text-green-400">لقد اجتزت الاختبار بنجاح!</span>
              ) : (
                <span className="text-red-400">لم تجتز الاختبار. حاول مرة أخرى!</span>
              )}
            </p>
          </div>
          
          <div className="flex justify-center gap-2 mb-2">
            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm">
              {quizResults.correctAnswers} صحيحة
            </div>
            <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm">
              {quizResults.totalQuestions - quizResults.correctAnswers} خاطئة
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            onClick={handleViewResults}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
          >
            حابب تشوف النتيجة؟
          </Button>
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