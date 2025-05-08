'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeNotification } from '@/store/slices/uiSlice';
import { toast, Toaster } from 'react-hot-toast';

/**
 * NotificationToast component
 * Displays notifications from the Redux store using react-hot-toast
 */
export function NotificationToast() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.ui.notifications);

  useEffect(() => {
    // Display new notifications as toasts
    notifications.forEach(notification => {
      const { id, type, message, duration = 5000 } = notification;
      
      // Only show each notification once
      const toastConfig = {
        id,
        duration,
        onClose: () => {
          dispatch(removeNotification(id));
        },
      };

      // Use the appropriate toast function based on type
      switch (type) {
        case 'success':
          toast.success(message, toastConfig);
          break;
        case 'error':
          toast.error(message, toastConfig);
          break;
        case 'loading':
          toast.loading(message, toastConfig);
          break;
        default:
          toast(message, toastConfig); // Default toast for unknown types
      }
    });
  }, [notifications, dispatch]);

  return <Toaster position="top-right" />;
}

export { Toaster };
