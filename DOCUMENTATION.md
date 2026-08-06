# Mr. Lotfy Zahran Educational Platform - Technical Documentation

## Application Architecture

This document provides technical details about the architecture, state management, and best practices implemented in the Mr. Lotfy Zahran Educational Platform.

### Frontend Architecture

The application is built using Next.js 14 with the App Router, providing a modern React framework with built-in features like server-side rendering, static site generation, and API routes. The architecture follows these key principles:

1. **Component-Based Structure**: UI is composed of reusable components
2. **Client-Side Navigation**: Fast page transitions with Next.js Link component
3. **Server Components**: Leveraging Next.js server components where appropriate
4. **Responsive Design**: Mobile-first approach with Tailwind CSS

## State Management

### Redux Implementation

The application uses Redux Toolkit for global state management. The implementation follows these best practices:

#### Store Configuration

The Redux store is configured in `store/store.ts` with the following slices:

- **Auth Slice**: Manages authentication state (user data, login status)
- **Course Slice**: Handles course-related state (available courses, enrollment status)
- **UI Slice**: Manages UI-related state (theme, notifications, loading states)
- **Quiz Slice**: Manages quiz-related state (quiz data, submissions, results)
  - Quiz attempt tracking
  - Video completion status
  - Quiz results and history
  - Performance analytics

#### Redux Best Practices

1. **Use Redux Toolkit**: Simplifies store setup and reduces boilerplate
2. **TypeScript Integration**: Full type safety for actions and state
3. **Normalized State**: Store complex data in normalized form
4. **Selective State Access**: Use selectors to access specific parts of state
5. **Async Logic**: Use createAsyncThunk for API calls and async operations

### Local vs. Global State

Guidelines for state management:

- **Use Redux for**:
  - User authentication data
  - Course enrollment status
  - Data needed across multiple components
  - Data that persists across page navigation

- **Use Local State for**:
  - UI state specific to a single component
  - Form input values during form completion
  - Temporary visual states (expanded/collapsed, etc.)

## Authentication Flow

The authentication system uses JWT tokens with the following flow:

1. **Login/Registration**: User credentials sent to API
2. **Token Storage**: In-memory accessToken management via central `apiClient` (`lib/api-client.ts`), eliminating vulnerable localStorage token reads.
3. **Auth State**: Non-sensitive login flag stored in cookies for server middleware verification; user profile stored in Redux.
4. **Protected Routes**: Handled server-side via Next.js `middleware.ts`.

## API Integration

API calls follow these patterns:

1. **Centralized API Services**: API calls are strictly organized in dedicated service files:
   - `services/authService.ts`
   - `services/courseService.ts`
   - `services/quizService.ts`
   - `services/assignmentService.ts`
   - `services/userService.ts`
2. **Central HTTP Client**: `lib/api-client.ts` manages Bearer tokens, HTTP 429 rate limits, and `{ success, data, meta }` response envelope parsing.
3. **DRY Redux Architecture**: Redux async thunks delegate directly to the service layer without re-implementing inline `fetch()` or `localStorage` access.
4. **Resilient Data Parsing**: Service functions seamlessly handle both `{ success: true, data }` envelopes and flat API response payloads.

---

## Execution Status Update

### [1] What Was Just Done
- **Branch Created**: Checked out `feature/phase-2-3-service-redux-layer`.
- **Phase 2 — Service Layer Completed**:
  - Rewrote [`services/courseService.ts`](file:///C:/Users/os/Desktop/E-LRN-FRONTEND/a-e-lrn-frontend/services/courseService.ts) to use `apiClient`, updated to `/enroll/status` (`{ courseId }`) and added pagination support.
  - Created [`services/quizService.ts`](file:///C:/Users/os/Desktop/E-LRN-FRONTEND/a-e-lrn-frontend/services/quizService.ts) for all quiz and video progress calls, updating video completion to `POST /progress/mark` (`{ videoId, completed: true }`).
  - Created [`services/assignmentService.ts`](file:///C:/Users/os/Desktop/E-LRN-FRONTEND/a-e-lrn-frontend/services/assignmentService.ts) for all assignment operations.
  - Created [`services/userService.ts`](file:///C:/Users/os/Desktop/E-LRN-FRONTEND/a-e-lrn-frontend/services/userService.ts) for profile retrieval.
- **Phase 3 — Redux Slices Cleaned Up**:
  - Rewrote [`store/slices/courseSlice.ts`](file:///C:/Users/os/Desktop/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/courseSlice.ts) — thunks delegate directly to `courseService`; added pagination state.
  - Rewrote [`store/slices/quizSlice.ts`](file:///C:/Users/os/Desktop/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/quizSlice.ts) — thunks delegate to `quizService`; updated `completeVideo` to use `/progress/mark`.
  - Rewrote [`store/slices/assignmentSlice.ts`](file:///C:/Users/os/Desktop/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/assignmentSlice.ts) — eliminated sequential N+1 HTTP loop in `fetchAssignmentsByCourse` in favor of parallel `Promise.all` fetches.
- **State & Git Tracking**:
  - Updated [`PLANNING.md`](file:///C:/Users/os/Desktop/E-LRN-FRONTEND/a-e-lrn-frontend/PLANNING.md) tracking task status for Phase 2 & Phase 3 as Done.
  - Built and type-checked clean with `npx tsc --noEmit`.
  - Committed changes under `feat(service-redux): complete Phase 2 service layer and Phase 3 Redux slices cleanup`.

### [2] Current Blockers
- None.

### [3] Immediate Next Step
- Phase 4: Refactor pages & UI components (`app/course/[id]/page.tsx`, `components/enrollment-card.tsx`, etc.) to remove remaining direct `localStorage.getItem('refreshToken')` and inline `fetch()` calls, using the new Redux thunks and services.