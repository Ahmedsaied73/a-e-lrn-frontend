'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

/**
 * Component for handling authentication errors throughout the application
 * Checks for error messages in localStorage and displays them
 */
export function AuthErrorHandler() {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check for error message stored in localStorage
    const authError = localStorage.getItem('authError');
    if (authError) {
      // Display error message using the toast notification system
      toast({
        variant: 'destructive',
        title: 'خطأ في المصادقة',
        description: authError,
        duration: 5000,
      });

      // Clear error message after displaying it
      localStorage.removeItem('authError');
    }
  }, [toast]);

  return null; // This component doesn't render any UI
}