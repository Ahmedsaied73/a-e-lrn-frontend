/**
 * Authentication Service
 * Centralizes all authentication-related API calls
 */

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  phoneNumber: string;
  grade: string;
  password: string;
}

const API_URL = 'http://localhost:3005';

/**
 * Login user with email and password
 */
export const loginUser = async (credentials: LoginCredentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'فشل في تسجيل الدخول');
  }

  const userData = await response.json();
  
  // Store auth data in localStorage
  if (userData.refreshToken) {
    localStorage.setItem('refreshToken', userData.refreshToken);
    
    if (userData.user && userData.user.id) {
      localStorage.setItem('userId', userData.user.id.toString());
    }
    if (userData.user && userData.user.name) {
      localStorage.setItem('userName', userData.user.name);
    }
    if (userData.user && userData.user.email) {
      localStorage.setItem('userEmail', userData.user.email);
    }
    if (userData.user && userData.user.role) {
      localStorage.setItem('userRole', userData.user.role);
    }
    
    // Store the entire user object as JSON string
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  return userData;
};

/**
 * Register a new user
 */
export const registerUser = async (userData: RegisterData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'فشل في تسجيل الحساب');
  }

  return await response.json();
};

/**
 * Logout user - clear all stored data
 */
export const logoutUser = () => {
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userData');
};

/**
 * Get current user data from API
 */
export const getCurrentUser = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/user/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return await response.json();
};