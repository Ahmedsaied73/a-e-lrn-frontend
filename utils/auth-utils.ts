import { store } from '@/store/store';
import { logout } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { clearAccessToken } from '@/lib/api-client';

/**
 * Handle 401 authentication error (Unauthorized)
 * Clears user data and redirects to login page
 */
export const handleAuthError = () => {
  // Clear token in memory
  clearAccessToken();
  
  // Clear cookie
  if (typeof document !== 'undefined') {
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
  
  // Clear old local storage items just in case
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userData');
  localStorage.removeItem('isLoggedIn');
  
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