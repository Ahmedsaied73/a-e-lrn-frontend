import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Types
export interface QuizQuestion {
  id: number;
  text: string;
  options: string[] | { id: number; text: string }[];
  points: number;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  isFinal: boolean;
  passingScore: number;
  videoId: number | null;
  videoTitle: string | null;
  questionCount: number;
  createdAt: string;
  status?: {
    taken: boolean;
    score: number | null;
    passed: boolean | null;
    submittedAt: string | null;
  };
  questions?: QuizQuestion[];
}

export interface QuizResult {
  quizId: number;
  title: string;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  passingScore: number;
  passed: boolean;
  submittedAt: string;
  results: {
    questionId: number;
    questionText: string;
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    points: number;
    explanation: string;
  }[];
}

export interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  quizResults: QuizResult | null;
  loading: boolean;
  error: string | null;
  videoCompleted: boolean;
  selectedAnswers: Record<number, number>;
  submitting: boolean;
  submitSuccess: boolean;
}

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  quizResults: null,
  loading: false,
  error: null,
  videoCompleted: false,
  selectedAnswers: {},
  submitting: false,
  submitSuccess: false,
};

// Async thunks
export const fetchQuizzesByCourse = createAsyncThunk(
  'quiz/fetchQuizzesByCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch(`http://localhost:3005/quizzes/course/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const fetchQuizById = createAsyncThunk(
  'quiz/fetchQuizById',
  async (quizId: number, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch(`http://localhost:3005/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const completeVideo = createAsyncThunk(
  'quiz/completeVideo',
  async ({ videoId }: { videoId: string | number }, { rejectWithValue }) => {
    // تحويل معرف الفيديو إلى رقم
    const numericVideoId = Number(videoId);
    if (isNaN(numericVideoId)) {
      return rejectWithValue('Invalid video ID format');
    }
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch('http://localhost:3005/progress/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        body: JSON.stringify({ videoId: numericVideoId })
      });

      if (!response.ok) {
        throw new Error('Failed to mark video as completed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const submitQuizAnswers = createAsyncThunk(
  'quiz/submitQuizAnswers',
  async ({ quizId, answers }: { quizId: number, answers: { questionId: number, selectedOption: number }[] }, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch('http://localhost:3005/quizzes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        body: JSON.stringify({ quizId, answers })
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz answers');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const fetchQuizResults = createAsyncThunk(
  'quiz/fetchQuizResults',
  async (quizId: number, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return rejectWithValue('Not authenticated');
      }

      const response = await fetch(`http://localhost:3005/quizzes/${quizId}/results`, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz results');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setVideoCompleted: (state, action: PayloadAction<boolean>) => {
      state.videoCompleted = action.payload;
    },
    setSelectedAnswer: (state, action: PayloadAction<{ questionId: number, optionId: number }>) => {
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
    }
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
      .addCase(completeVideo.fulfilled, (state) => {
        state.loading = false;
        state.videoCompleted = true;
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
      });
  },
});

export const { setVideoCompleted, setSelectedAnswer, resetQuizState, resetSubmitState } = quizSlice.actions;

// Selectors
export const selectQuizState = (state: RootState) => state.quiz;
export const selectQuizzes = (state: RootState) => state.quiz.quizzes;
export const selectCurrentQuiz = (state: RootState) => state.quiz.currentQuiz;
export const selectQuizResults = (state: RootState) => state.quiz.quizResults;
export const selectVideoCompleted = (state: RootState) => state.quiz.videoCompleted;
export const selectSelectedAnswers = (state: RootState) => state.quiz.selectedAnswers;

export default quizSlice.reducer;