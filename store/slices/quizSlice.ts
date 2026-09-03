/**
 * Quiz Redux slice — store/slices/quizSlice.ts
 *
 * State management for the quiz/exam flow.
 * Follows the same conventions as assignmentSlice.ts / courseSlice.ts.
 */

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import { ApiError } from '@/lib/errors';
import type {
  QuizMeta,
  StartQuizData,
  SubmitQuizData,
  QuizResultData,
  AttemptSummary,
} from '@/types/quiz';
import {
  getQuizMeta,
  startQuiz,
  submitQuiz,
  getQuizResult,
  getQuizAttempts,
} from '@/services/quizService';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface QuizState {
  meta: QuizMeta | null;
  metaStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  activeAttempt: StartQuizData | null;
  submitResult: SubmitQuizData | null;
  result: QuizResultData | null;
  attempts: AttemptSummary[];
  error: string | null;
}

export interface QuizThunkError {
  message: string;
  status?: number;
  body?: unknown;
}

function toQuizThunkError(error: unknown, fallback: string): QuizThunkError {
  if (error instanceof ApiError) {
    return { message: error.message, status: error.status, body: error.body };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: fallback };
}

const initialState: QuizState = {
  meta: null,
  metaStatus: 'idle',
  activeAttempt: null,
  submitResult: null,
  result: null,
  attempts: [],
  error: null,
};

// ---------------------------------------------------------------------------
// Async Thunks
// ---------------------------------------------------------------------------

export const fetchQuizMeta = createAsyncThunk<QuizMeta, number | string, { rejectValue: QuizThunkError }>(
  'quiz/fetchQuizMeta',
  async (videoId, { rejectWithValue }) => {
    try {
      return await getQuizMeta(videoId);
    } catch (err: unknown) {
      return rejectWithValue(toQuizThunkError(err, 'حدث خطأ أثناء تحميل بيانات الاختبار'));
    }
  },
);

export const startQuizAttempt = createAsyncThunk<StartQuizData, number | string, { rejectValue: QuizThunkError }>(
  'quiz/startQuizAttempt',
  async (videoId, { rejectWithValue }) => {
    try {
      return await startQuiz(videoId);
    } catch (err: unknown) {
      return rejectWithValue(toQuizThunkError(err, 'تعذر بدء الاختبار'));
    }
  },
);

export const submitQuizAttempt = createAsyncThunk<
  SubmitQuizData,
  { attemptId: number; answers: Record<string, unknown>; autoSubmitted: boolean },
  { rejectValue: QuizThunkError }
>(
  'quiz/submitQuizAttempt',
  async ({ attemptId, answers, autoSubmitted }, { rejectWithValue }) => {
    try {
      return await submitQuiz(attemptId, answers, autoSubmitted);
    } catch (err: unknown) {
      return rejectWithValue(toQuizThunkError(err, 'تعذر تسليم الاختبار'));
    }
  },
);

export const fetchQuizResult = createAsyncThunk<QuizResultData, number | string, { rejectValue: QuizThunkError }>(
  'quiz/fetchQuizResult',
  async (attemptId, { rejectWithValue }) => {
    try {
      return await getQuizResult(attemptId);
    } catch (err: unknown) {
      return rejectWithValue(toQuizThunkError(err, 'تعذر تحميل نتيجة الاختبار'));
    }
  },
);

export const fetchQuizAttempts = createAsyncThunk<
  { attempts: AttemptSummary[] },
  number | string,
  { rejectValue: QuizThunkError }
>(
  'quiz/fetchQuizAttempts',
  async (videoId, { rejectWithValue }) => {
    try {
      const data = await getQuizAttempts(videoId);
      return { attempts: data.attempts };
    } catch (err: unknown) {
      return rejectWithValue(toQuizThunkError(err, 'تعذر تحميل سجل المحاولات'));
    }
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    resetQuizState(state) {
      state.meta = null;
      state.metaStatus = 'idle';
      state.activeAttempt = null;
      state.submitResult = null;
      state.result = null;
      state.attempts = [];
      state.error = null;
    },
    clearActiveAttempt(state) {
      state.activeAttempt = null;
      state.submitResult = null;
    },
  },
  extraReducers: (builder) => {
    // fetchQuizMeta
    builder
      .addCase(fetchQuizMeta.pending, (state) => {
        state.metaStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchQuizMeta.fulfilled, (state, action) => {
        state.metaStatus = 'succeeded';
        state.meta = action.payload;
      })
      .addCase(fetchQuizMeta.rejected, (state, action) => {
        state.metaStatus = 'failed';
        state.error = action.payload?.message ?? action.error.message ?? 'تعذر تحميل بيانات الاختبار';
      });

    // startQuizAttempt
    builder
      .addCase(startQuizAttempt.pending, (state) => {
        state.error = null;
      })
      .addCase(startQuizAttempt.fulfilled, (state, action) => {
        state.activeAttempt = action.payload;
      })
      .addCase(startQuizAttempt.rejected, (state, action) => {
        state.error = action.payload?.message ?? action.error.message ?? 'تعذر بدء الاختبار';
      });

    // submitQuizAttempt
    builder
      .addCase(submitQuizAttempt.fulfilled, (state, action) => {
        state.submitResult = action.payload;
        state.activeAttempt = null;
      })
      .addCase(submitQuizAttempt.rejected, (state, action) => {
        state.error = action.payload?.message ?? action.error.message ?? 'تعذر تسليم الاختبار';
      });

    // fetchQuizResult
    builder
      .addCase(fetchQuizResult.fulfilled, (state, action) => {
        state.result = action.payload;
      })
      .addCase(fetchQuizResult.rejected, (state, action) => {
        state.error = action.payload?.message ?? action.error.message ?? 'تعذر تحميل النتيجة';
      });

    // fetchQuizAttempts
    builder
      .addCase(fetchQuizAttempts.fulfilled, (state, action) => {
        state.attempts = action.payload.attempts;
      })
      .addCase(fetchQuizAttempts.rejected, (state, action) => {
        state.error = action.payload?.message ?? action.error.message ?? 'تعذر تحميل سجل المحاولات';
      });
  },
});

export const { resetQuizState, clearActiveAttempt } = quizSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectQuizMeta = (state: RootState) => state.quiz.meta;
export const selectQuizMetaStatus = (state: RootState) => state.quiz.metaStatus;
export const selectActiveAttempt = (state: RootState) => state.quiz.activeAttempt;
export const selectSubmitResult = (state: RootState) => state.quiz.submitResult;
export const selectQuizResult = (state: RootState) => state.quiz.result;
export const selectQuizAttempts = (state: RootState) => state.quiz.attempts;
export const selectQuizError = (state: RootState) => state.quiz.error;

export default quizSlice.reducer;
