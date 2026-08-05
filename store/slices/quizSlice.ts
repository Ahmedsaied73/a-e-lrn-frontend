import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
  fetchQuizzesByCourse as svcFetchQuizzesByCourse,
  fetchQuizById as svcFetchQuizById,
  submitQuizAnswers as svcSubmitQuizAnswers,
  fetchQuizResults as svcFetchQuizResults,
  fetchQuizStatus as svcFetchQuizStatus,
  fetchVideoProgress as svcFetchVideoProgress,
  markVideoComplete as svcMarkVideoComplete,
  Quiz,
  QuizResult,
  QuizStatus,
  VideoProgress,
} from '@/services/quizService';

// ---------------------------------------------------------------------------
// Re-export types for backwards compat with components importing from slice
// ---------------------------------------------------------------------------
export type { Quiz, QuizResult, QuizStatus };
export type { QuizQuestion } from '@/services/quizService';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  quizResults: QuizResult | null;
  quizStatuses: Record<number, QuizStatus>;
  loading: boolean;
  error: string | null;
  videoCompleted: boolean;
  videoProgressMap: Record<string, { completed: boolean; watchedAt: string | null }>;
  selectedAnswers: Record<number, number>;
  submitting: boolean;
  submitSuccess: boolean;
}

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  quizResults: null,
  quizStatuses: {},
  loading: false,
  error: null,
  videoCompleted: false,
  videoProgressMap: {},
  selectedAnswers: {},
  submitting: false,
  submitSuccess: false,
};

// ---------------------------------------------------------------------------
// Async thunks — delegate to quizService (no inline fetch / no localStorage)
// ---------------------------------------------------------------------------

export const fetchQuizzesByCourse = createAsyncThunk(
  'quiz/fetchQuizzesByCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      return await svcFetchQuizzesByCourse(courseId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const fetchQuizById = createAsyncThunk(
  'quiz/fetchQuizById',
  async (quizId: number, { rejectWithValue }) => {
    try {
      return await svcFetchQuizById(quizId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

/**
 * Mark a video as completed.
 * Calls POST /progress/mark { videoId, completed: true }
 * (replaces the old POST /progress/complete { videoId })
 */
export const completeVideo = createAsyncThunk(
  'quiz/completeVideo',
  async ({ videoId }: { videoId: string | number }, { rejectWithValue }) => {
    const numericId = Number(videoId);
    if (isNaN(numericId)) {
      return rejectWithValue('Invalid video ID format');
    }
    try {
      return await svcMarkVideoComplete(numericId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const submitQuizAnswers = createAsyncThunk(
  'quiz/submitQuizAnswers',
  async (
    { quizId, answers }: { quizId: number; answers: { questionId: number; selectedOption: number }[] },
    { rejectWithValue },
  ) => {
    try {
      return await svcSubmitQuizAnswers(quizId, answers);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const fetchQuizResults = createAsyncThunk(
  'quiz/fetchQuizResults',
  async (quizId: number, { rejectWithValue }) => {
    try {
      return await svcFetchQuizResults(quizId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const fetchQuizStatus = createAsyncThunk(
  'quiz/fetchQuizStatus',
  async (quizId: number, { rejectWithValue }) => {
    try {
      return await svcFetchQuizStatus(quizId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

export const fetchVideoProgress = createAsyncThunk(
  'quiz/fetchVideoProgress',
  async (videoId: string | number, { rejectWithValue }) => {
    try {
      return await svcFetchVideoProgress(videoId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

export const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setVideoCompleted: (state, action: PayloadAction<boolean>) => {
      state.videoCompleted = action.payload;
    },
    setSelectedAnswer: (state, action: PayloadAction<{ questionId: number; optionId: number }>) => {
      const { questionId, optionId } = action.payload;
      state.selectedAnswers[questionId] = optionId;
    },
    resetQuizState: (state) => {
      state.currentQuiz = null;
      state.quizResults = null;
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
      // fetchQuizzesByCourse
      .addCase(fetchQuizzesByCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizzesByCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.quizzes = action.payload;
      })
      .addCase(fetchQuizzesByCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchQuizById
      .addCase(fetchQuizById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuiz = action.payload;
      })
      .addCase(fetchQuizById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // completeVideo
      .addCase(completeVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.videoCompleted = true;
        // Update the videoProgressMap with the latest progress from server
        const progress = action.payload as VideoProgress;
        if (progress?.videoId !== undefined) {
          state.videoProgressMap[String(progress.videoId)] = {
            completed: progress.completed,
            watchedAt: progress.watchedAt,
          };
        }
      })
      .addCase(completeVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // submitQuizAnswers
      .addCase(submitQuizAnswers.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitQuizAnswers.fulfilled, (state, action) => {
        state.submitting = false;
        state.submitSuccess = true;
        state.quizResults = action.payload;
      })
      .addCase(submitQuizAnswers.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })

      // fetchQuizResults
      .addCase(fetchQuizResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.loading = false;
        state.quizResults = action.payload;
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchQuizStatus
      .addCase(fetchQuizStatus.fulfilled, (state, action) => {
        const quizStatus = action.payload;
        state.quizStatuses[quizStatus.quizId] = quizStatus;
      })

      // fetchVideoProgress
      .addCase(fetchVideoProgress.fulfilled, (state, action) => {
        const { videoId, completed, watchedAt } = action.payload;
        state.videoProgressMap[String(videoId)] = { completed, watchedAt };
      });
  },
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const { setVideoCompleted, setSelectedAnswer, resetQuizState, resetSubmitState } =
  quizSlice.actions;

export const selectQuizState = (state: RootState) => state.quiz;
export const selectQuizzes = (state: RootState) => state.quiz.quizzes;
export const selectCurrentQuiz = (state: RootState) => state.quiz.currentQuiz;
export const selectQuizResults = (state: RootState) => state.quiz.quizResults;
export const selectVideoCompleted = (state: RootState) => state.quiz.videoCompleted;
export const selectSelectedAnswers = (state: RootState) => state.quiz.selectedAnswers;

export const selectQuizStatus = (quizId: number) => (state: RootState) =>
  state.quiz.quizStatuses[quizId] || null;

export const selectVideoProgress = (videoId: string | number) => (state: RootState) =>
  state.quiz.videoProgressMap[String(videoId)] || { completed: false, watchedAt: null };

export default quizSlice.reducer;