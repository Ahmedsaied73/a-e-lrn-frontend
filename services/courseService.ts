/**
 * Course Service
 * Centralizes all course-related API calls
 */

interface EnrollmentCheckData {
  userId: string;
  courseId: string;
}

const API_URL = 'http://localhost:3005';

/**
 * Fetch all available courses
 */
export const fetchAllCourses = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/courses`, {
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }

  return await response.json();
};

/**
 * Fetch a specific course by ID
 */
export const fetchCourseById = async (courseId: string) => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/courses/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch course data');
  }

  return await response.json();
};

/**
 * Check if a user is enrolled in a specific course
 */
export const checkEnrollmentStatus = async ({ userId, courseId }: EnrollmentCheckData) => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/enroll/api/enrollment-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`
    },
    body: JSON.stringify({ userId, courseId })
  });

  if (!response.ok) {
    throw new Error('Failed to check enrollment status');
  }

  const data = await response.json();
  return { courseId, enrolled: !!data.enrolled };
};

/**
 * Enroll a user in a course
 */
export const enrollInCourse = async ({ userId, courseId }: EnrollmentCheckData) => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`
    },
    body: JSON.stringify({ userId, courseId })
  });

  if (!response.ok) {
    throw new Error('Failed to enroll in course');
  }

  return await response.json();
};