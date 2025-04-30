import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Define types for course data
export interface Course {
  id: string;
  title: string;
  description?: string;
  price?: string;
  duration?: string;
  files_count?: number;
  videos_count?: number;
  exams_count?: number;
  questions_count?: string;
  videos?: Array<{
    id: string;
    title: string;
    url?: string;
  }>;
}

export interface EnrollmentStatus {
  courseId: string;
  enrolled: boolean;
}

// Define the state structure
export interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  enrollments: EnrollmentStatus[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: CourseState = {
  courses: [],
  currentCourse: null,
  enrollments: [],
  loading: false,
  error: null,
};

// Async thunks for API calls
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch('http://localhost:3005/courses', {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchCourseById',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch(`http://localhost:3005/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const checkEnrollmentStatus = createAsyncThunk(
  'courses/checkEnrollmentStatus',
  async ({ userId, courseId }: { userId: string; courseId: string }, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch('http://localhost:3005/enroll/api/enrollment-status', {
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
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

// Create the slice
const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setCurrentCourse: (state, action: PayloadAction<Course>) => {
      state.currentCourse = action.payload;
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
    updateEnrollmentStatus: (state, action: PayloadAction<EnrollmentStatus>) => {
      const { courseId, enrolled } = action.payload;
      const existingIndex = state.enrollments.findIndex(e => e.courseId === courseId);
      
      if (existingIndex >= 0) {
        state.enrollments[existingIndex].enrolled = enrolled;
      } else {
        state.enrollments.push({ courseId, enrolled });
      }
    },
  },
  extraReducers: (builder) => {
    // Handle fetchCourses
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    // Handle fetchCourseById
    builder
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    // Handle checkEnrollmentStatus
    builder
      .addCase(checkEnrollmentStatus.fulfilled, (state, action) => {
        const { courseId, enrolled } = action.payload;
        const existingIndex = state.enrollments.findIndex(e => e.courseId === courseId);
        
        if (existingIndex >= 0) {
          state.enrollments[existingIndex].enrolled = enrolled;
        } else {
          state.enrollments.push({ courseId, enrolled });
        }
      });
  },
});

// Export actions and selectors
export const { setCurrentCourse, clearCurrentCourse, updateEnrollmentStatus } = courseSlice.actions;

export const selectAllCourses = (state: RootState) => state.courses.courses;
export const selectCurrentCourse = (state: RootState) => state.courses.currentCourse;
export const selectEnrollmentStatus = (courseId: string) => (state: RootState) => 
  state.courses.enrollments.find(e => e.courseId === courseId)?.enrolled || false;
export const selectCoursesLoading = (state: RootState) => state.courses.loading;
export const selectCoursesError = (state: RootState) => state.courses.error;

export default courseSlice.reducer;