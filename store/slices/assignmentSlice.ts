import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Types
export interface AssignmentQuestion {
  id: number;
  text: string;
  options: string[] | { id: number; text: string }[];
  points: number;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  videoId: number | null;
  dueDate: string;
  isMCQ: boolean;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
  hasSubmitted: boolean;
  submission: {
    id: number;
    status: string;
    grade: number;
    submittedAt: string;
  } | null;
  questions?: AssignmentQuestion[];
}

export interface AssignmentResult {
  assignmentId: number;
  title: string;
  mcqScore?: number;
  grade?: number;
  passingScore: number;
  passed: boolean;
  submittedAt: string;
  status: string;
  message: string;
}

export interface AssignmentStatus {
  assignmentId: number;
  title: string;
  submitted: boolean;
  status: 'GRADED' | 'PENDING' | 'NOT_SUBMITTED';
  message: string;
  dueDate: string;
  isPastDue: boolean;
}

export interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  assignmentResults: AssignmentResult | null;
  assignmentStatuses: Record<number, AssignmentStatus>;
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
  loading: false,
  error: null,
  selectedAnswers: {},
  submitting: false,
  submitSuccess: false,
};

// Async thunks
export const fetchAssignmentsByVideo = createAsyncThunk(
  'assignment/fetchAssignmentsByVideo',
  async (videoId: string | number, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch(`http://localhost:3005/assignments/video/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      return data.assignments;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const fetchAssignmentById = createAsyncThunk(
  'assignment/fetchAssignmentById',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch(`http://localhost:3005/assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignment');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const submitAssignment = createAsyncThunk(
  'assignment/submitAssignment',
  async ({ assignmentId, answers, content, fileUrl }: { 
    assignmentId: number, 
    answers?: { questionId: number, selectedOption: number }[],
    content?: string,
    fileUrl?: string
  }, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      // Prepare request body based on assignment type (MCQ or regular)
      let requestBody: any = { assignmentId };
      if (answers) {
        requestBody.answers = answers; // For MCQ assignments
      } else {
        requestBody.content = content; // For regular assignments
        if (fileUrl) requestBody.fileUrl = fileUrl;
      }

      const response = await fetch('http://localhost:3005/assignments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        // Create an error message that includes the status code
        const errorMessage = `STATUS_${response.status}: Failed to submit assignment`;
        return rejectWithValue(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const fetchAssignmentStatus = createAsyncThunk(
  'assignment/fetchAssignmentStatus',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch(`http://localhost:3005/assignments/${assignmentId}/status`, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignment status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const fetchAssignmentSubmissions = createAsyncThunk(
  'assignment/fetchAssignmentSubmissions',
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch(`http://localhost:3005/assignments/${assignmentId}/submissions`, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignment submissions');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    setSelectedAnswer: (state, action: PayloadAction<{ questionId: number, optionId: number }>) => {
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
    }
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
        // Handle submissions data if needed
      })
      .addCase(fetchAssignmentSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedAnswer, resetAssignmentState, resetSubmitState } = assignmentSlice.actions;

// Selectors
export const selectAssignmentState = (state: RootState) => state.assignment;
export const selectAssignments = (state: RootState) => state.assignment.assignments;
export const selectCurrentAssignment = (state: RootState) => state.assignment.currentAssignment;
export const selectAssignmentResults = (state: RootState) => state.assignment.assignmentResults;
export const selectSelectedAnswers = (state: RootState) => state.assignment.selectedAnswers;

// New selectors
export const selectAssignmentStatus = (assignmentId: number) => (state: RootState) => 
  state.assignment.assignmentStatuses[assignmentId] || null;

export default assignmentSlice.reducer;