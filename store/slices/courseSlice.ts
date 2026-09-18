import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
  fetchAllCourses as courseSvcFetchAll,
  fetchCourseBySlug as courseSvcFetchBySlug,
  checkEnrollmentStatus as courseSvcCheckEnrollment,
  enrollInCourse as courseSvcEnroll,
  CourseDetail,
  CourseListItem,
} from '@/services/courseService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Course extends CourseDetail {
  // Re-exported for backwards compatibility with components
}

export interface EnrollmentStatus {
  courseSlug: string;
  enrolled: boolean;
  isPaid?: boolean;
}

export interface CourseState {
  courses: CourseListItem[];
  currentCourse: CourseDetail | null;
  enrollments: EnrollmentStatus[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: CourseState = {
  courses: [],
  currentCourse: null,
  enrollments: [],
  loading: false,
  error: null,
  pagination: null,
};

// ---------------------------------------------------------------------------
// Async thunks — delegate to courseService (no inline fetch)
// ---------------------------------------------------------------------------

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      return await courseSvcFetchAll(page, limit);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const fetchCourseBySlug = createAsyncThunk<
  CourseDetail,
  string
>(
  'courses/fetchCourseById',
  async (courseSlug: string, { rejectWithValue }) => {
    try {
      return await courseSvcFetchBySlug(courseSlug);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const checkEnrollmentStatus = createAsyncThunk(
  'courses/checkEnrollmentStatus',
  async (courseSlug: string, { rejectWithValue }) => {
    try {
      return await courseSvcCheckEnrollment(courseSlug);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const enrollInCourse = createAsyncThunk(
  'courses/enrollInCourse',
  async (courseSlug: string, { rejectWithValue }) => {
    try {
      return await courseSvcEnroll(courseSlug);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setCurrentCourse: (state, action: PayloadAction<CourseDetail>) => {
      state.currentCourse = action.payload;
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
    updateEnrollmentStatus: (state, action: PayloadAction<EnrollmentStatus>) => {
      const { courseSlug, enrolled } = action.payload;
      const idx = state.enrollments.findIndex((e) => String(e.courseSlug) === String(courseSlug));
      if (idx >= 0) {
        state.enrollments[idx] = action.payload;
      } else {
        state.enrollments.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCourses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchCourseBySlug
      .addCase(fetchCourseBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const course = action.payload;
        const enrollment = action.payload.enrollment;
        state.currentCourse = course;

        // Upsert enrollment status from consolidated payload
        const courseSlug = course?.slug;
        if (courseSlug !== undefined) {
          const enrolled = enrollment !== null && enrollment !== undefined;
          const isPaid = enrollment?.isPaid ?? false;
          const idx = state.enrollments.findIndex(
            (e) => String(e.courseSlug) === String(courseSlug),
          );
          if (idx >= 0) {
            state.enrollments[idx] = { courseSlug, enrolled, isPaid };
          } else {
            state.enrollments.push({ courseSlug, enrolled, isPaid });
          }
        }
      })
      .addCase(fetchCourseBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // checkEnrollmentStatus
      .addCase(checkEnrollmentStatus.fulfilled, (state, action) => {
        const { courseSlug, enrolled, isPaid } = action.payload;
        const idx = state.enrollments.findIndex((e) => String(e.courseSlug) === String(courseSlug));
        if (idx >= 0) {
          state.enrollments[idx] = { courseSlug, enrolled, isPaid };
        } else {
          state.enrollments.push({ courseSlug, enrolled, isPaid });
        }
      })

      // enrollInCourse
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        const { courseSlug, enrolled, isPaid } = action.payload;
        const idx = state.enrollments.findIndex((e) => String(e.courseSlug) === String(courseSlug));
        if (idx >= 0) {
          state.enrollments[idx] = { courseSlug, enrolled, isPaid };
        } else {
          state.enrollments.push({ courseSlug, enrolled, isPaid });
        }
      });
  },
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const { setCurrentCourse, clearCurrentCourse, updateEnrollmentStatus } = courseSlice.actions;

export const selectAllCourses = (state: RootState) => state.courses.courses;
export const selectCurrentCourse = (state: RootState) => state.courses.currentCourse;
export const selectCoursePagination = (state: RootState) => state.courses.pagination;
export const selectEnrollmentStatus = (courseSlug: string) => (state: RootState) =>
  state.courses.enrollments.find((e) => String(e.courseSlug) === String(courseSlug))?.enrolled ?? false;
export const selectCoursesLoading = (state: RootState) => state.courses.loading;
export const selectCoursesError = (state: RootState) => state.courses.error;

export default courseSlice.reducer;