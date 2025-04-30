'use client';

import { useAppSelector } from '@/store/hooks';
import { selectGlobalLoading } from '@/store/slices/uiSlice';

/**
 * LoadingIndicator component
 * Displays a loading spinner when global loading state is true
 */
export function LoadingIndicator() {
  const isLoading = useAppSelector(selectGlobalLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg p-6 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-t-[rgb(var(--primary))] border-r-transparent border-b-[rgb(var(--primary))] border-l-transparent animate-spin" />
          <p className="text-foreground font-medium">جاري التحميل...</p>
        </div>
      </div>
    </div>
  );
}