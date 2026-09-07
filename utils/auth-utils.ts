import { store } from '@/store/store';
import { logout } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { purgeLegacyAuthStorage } from '@/utils/auth-storage';

/**
 * Handle 401 authentication error (Unauthorized)
 * Clears user data and redirects to login page
 */
export const handleAuthError = () => {
  // Purge any legacy token-ish localStorage from older builds
  purgeLegacyAuthStorage();

  // Clear cookie UX flag
  if (typeof document !== 'undefined') {
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }

  try {
    store.dispatch(logout());
    store.dispatch(addNotification({
      type: 'error',
      message: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      duration: 5000
    }));
  } catch (error) {
    // Ignore error if store isn't available
  }
  
  if (typeof window !== 'undefined') {
    window.location.replace('/login');
  }
};

/**
 * Check API response to handle authentication errors
 * @param response Server response
 * @returns true if the response indicates an authentication error
 */
export const checkAuthResponse = (response: Response): boolean => {
  if (response.status === 401) {
    handleAuthError();
    return true;
  }
  return false;
};