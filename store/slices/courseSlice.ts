import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
  fetchAllCourses as courseSvcFetchAll,
  fetchCourseById as courseSvcFetchById,
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
  courseId: string | number;
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

export const fetchCourseById = createAsyncThunk<
  CourseDetail,
  string
>(
  'courses/fetchCourseById',
  async (courseId: string, { rejectWithValue }) => {
    try {
      return await courseSvcFetchById(courseId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const checkEnrollmentStatus = createAsyncThunk(
  'courses/checkEnrollmentStatus',
  async (courseId: string, { rejectWithValue }) => {
    try {
      return await courseSvcCheckEnrollment(courseId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const enrollInCourse = createAsyncThunk(
  'courses/enrollInCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      return await courseSvcEnroll(courseId);
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
      const { courseId, enrolled } = action.payload;
      const idx = state.enrollments.findIndex((e) => String(e.courseId) === String(courseId));
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

      // fetchCourseById
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const course = action.payload;
        const enrollment = action.payload.enrollment;
        state.currentCourse = course;

        // Upsert enrollment status from consolidated payload
        const courseId = course?.id;
        if (courseId !== undefined) {
          const enrolled = enrollment !== null && enrollment !== undefined;
          const isPaid = enrollment?.isPaid ?? false;
          const idx = state.enrollments.findIndex(
            (e) => String(e.courseId) === String(courseId),
          );
          if (idx >= 0) {
            state.enrollments[idx] = { courseId, enrolled, isPaid };
          } else {
            state.enrollments.push({ courseId, enrolled, isPaid });
          }
        }
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // checkEnrollmentStatus
      .addCase(checkEnrollmentStatus.fulfilled, (state, action) => {
        const { courseId, enrolled, isPaid } = action.payload;
        const idx = state.enrollments.findIndex((e) => String(e.courseId) === String(courseId));
        if (idx >= 0) {
          state.enrollments[idx] = { courseId, enrolled, isPaid };
        } else {
          state.enrollments.push({ courseId, enrolled, isPaid });
        }
      })

      // enrollInCourse
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        const { courseId, enrolled, isPaid } = action.payload;
        const idx = state.enrollments.findIndex((e) => String(e.courseId) === String(courseId));
        if (idx >= 0) {
          state.enrollments[idx] = { courseId, enrolled, isPaid };
        } else {
          state.enrollments.push({ courseId, enrolled, isPaid });
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
export const selectEnrollmentStatus = (courseId: string | number) => (state: RootState) =>
  state.courses.enrollments.find((e) => String(e.courseId) === String(courseId))?.enrolled ?? false;
export const selectCoursesLoading = (state: RootState) => state.courses.loading;
export const selectCoursesError = (state: RootState) => state.courses.error;

export default courseSlice.reducer;