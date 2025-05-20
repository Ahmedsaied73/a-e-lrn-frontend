/**
 * Helper functions for authentication handling
 */
import { store } from '@/store/store';
import { logout } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';

/**
 * Handle 401 authentication error (Unauthorized)
 * Clears user data and redirects to login page
 */
export const handleAuthError = () => {
  // Clear user data from local storage
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userData');
  
  // Update Redux state
  try {
    // Logout from Redux
    store.dispatch(logout());
    
    // Add error notification
    store.dispatch(addNotification({
      type: 'error',
      message: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      duration: 5000
    }));
  } catch (error) {
    // In case of error, use alternative method
    localStorage.setItem('authError', 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
  }
  
  // Redirect user to login page
  window.location.href = '/login';
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