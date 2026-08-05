import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
  fetchAssignmentsByVideo as svcFetchByVideo,
  fetchAssignmentById as svcFetchById,
  submitAssignment as svcSubmit,
  fetchAssignmentStatus as svcFetchStatus,
  fetchAssignmentSubmissions as svcFetchSubmissions,
  Assignment,
  AssignmentResult,
  AssignmentStatus,
  AssignmentSubmission,
} from '@/services/assignmentService';

// ---------------------------------------------------------------------------
// Re-export types for backwards compat with components importing from slice
// ---------------------------------------------------------------------------
export type { Assignment, AssignmentResult, AssignmentStatus, AssignmentSubmission };
export type { AssignmentQuestion } from '@/services/assignmentService';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  assignmentResults: AssignmentResult | null;
  assignmentStatuses: Record<number, AssignmentStatus>;
  submissions: AssignmentSubmission[];
  loading: boolean;
  error: string | null;
  selectedAnswers: Record<number, number>;
  submitting: boolean;
  submitSuccess: boolean;
}

const initialState: AssignmentState = {
  assignments: [],
  currentAssignment: null,
  assignmentResults: null,
  assignmentStatuses: {},
  submissions: [],
  loading: false,
  error: null,
  selectedAnswers: {},
  submitting: false,
  submitSuccess: false,
};

// ---------------------------------------------------------------------------
// Async thunks — delegate to assignmentService (no inline fetch / no localStorage)
// ---------------------------------------------------------------------------

export const fetchAssignmentsByVideo = createAsyncThunk(
  'assignment/fetchAssignmentsByVideo',
  async (videoId: string | number, { rejectWithValue }) => {
    try {
      return await svcFetchByVideo(videoId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

/**
 * Fetch all assignments for a course using parallel per-video requests.
 * The N+1 sequential loop has been removed — requests are fired in parallel.
 * If a dedicated /assignments/course/:id endpoint is added later, update this thunk.
 */
export const fetchAssignmentsByCourse = createAsyncThunk(
  'assignment/fetchAssignmentsByCourse',
  async (
    { videoIds }: { courseId: string; videoIds: (string | number)[] },
    { rejectWithValue },
  ) => {
    try {
      // Parallel fetches — eliminates the sequential N+1 loop
      const results = await Promise.all(videoIds.map((id) => svcFetchByVideo(id)));
      return results.flat();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'An error occurred while fetching assignments',
      );
    }
  },
);

export const fetchAssignmentById = createAsyncThunk(
  'assignment/fetchAssignmentById',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      return await svcFetchById(assignmentId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const submitAssignment = createAsyncThunk(
  'assignment/submitAssignment',
  async (
    payload: {
      assignmentId: number;
      answers?: { questionId: number; selectedOption: number }[];
      content?: string;
      fileUrl?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await svcSubmit(payload);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const fetchAssignmentStatus = createAsyncThunk(
  'assignment/fetchAssignmentStatus',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      return await svcFetchStatus(assignmentId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const fetchAssignmentSubmissions = createAsyncThunk(
  'assignment/fetchAssignmentSubmissions',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      return await svcFetchSubmissions(assignmentId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

export const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    setSelectedAnswer: (state, action: PayloadAction<{ questionId: number; optionId: number }>) => {
      const { questionId, optionId } = action.payload;
      state.selectedAnswers[questionId] = optionId;
    },
    resetAssignmentState: (state) => {
      state.currentAssignment = null;
      state.assignmentResults = null;
      state.selectedAnswers = {};
      state.submitting = false;
      state.submitSuccess = false;
    },
    resetSubmitState: (state) => {
      state.submitting = false;
      state.submitSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAssignmentsByVideo
      .addCase(fetchAssignmentsByVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentsByVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAssignmentsByVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchAssignmentsByCourse (parallel)
      .addCase(fetchAssignmentsByCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentsByCourse.fulfilled, (state, action: PayloadAction<Assignment[]>) => {
        state.loading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAssignmentsByCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchAssignmentById
      .addCase(fetchAssignmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAssignment = action.payload;
      })
      .addCase(fetchAssignmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // submitAssignment
      .addCase(submitAssignment.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitAssignment.fulfilled, (state, action) => {
        state.submitting = false;
        state.submitSuccess = true;
        state.assignmentResults = action.payload;
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })

      // fetchAssignmentStatus
      .addCase(fetchAssignmentStatus.fulfilled, (state, action) => {
        const assignmentStatus = action.payload;
        state.assignmentStatuses[assignmentStatus.assignmentId] = assignmentStatus;
      })

      // fetchAssignmentSubmissions
      .addCase(fetchAssignmentSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload;
      })
      .addCase(fetchAssignmentSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const { setSelectedAnswer, resetAssignmentState, resetSubmitState } =
  assignmentSlice.actions;

export const selectAssignmentState = (state: RootState) => state.assignment;
export const selectAssignments = (state: RootState) => state.assignment.assignments;
export const selectCurrentAssignment = (state: RootState) => state.assignment.currentAssignment;
export const selectAssignmentResults = (state: RootState) => state.assignment.assignmentResults;
export const selectSelectedAnswers = (state: RootState) => state.assignment.selectedAnswers;
export const selectAssignmentSubmissions = (state: RootState) => state.assignment.submissions;

export const selectAssignmentStatus = (assignmentId: number) => (state: RootState) =>
  state.assignment.assignmentStatuses[assignmentId] || null;

export default assignmentSlice.reducer;