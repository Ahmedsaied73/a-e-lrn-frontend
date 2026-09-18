# Mr. Lotfy Zahran Educational Platform - Technical Documentation

## Application Architecture

This document provides technical details about the architecture, state management, and best practices implemented in the Mr. Lotfy Zahran Educational Platform.

### Frontend Architecture

The application is built using Next.js 14 with the App Router, providing a modern React framework with built-in features like server-side rendering, static site generation, and API routes. The architecture follows these key principles:

1. **Component-Based Structure**: UI is composed of reusable components
2. **Client-Side Navigation**: Fast page transitions with Next.js Link component
3. **Server Components**: Leveraging Next.js server components where appropriate
4. **Responsive Design**: Mobile-first approach with Tailwind CSS & RTL logical utility properties (`start/end`, `ms/me`, `ps/pe`)

## State Management

### Redux Implementation

The application uses Redux Toolkit for global state management. The implementation follows these best practices:

#### Store Configuration

The Redux store is configured in `store/store.ts` with the following slices:

- **Auth Slice**: Manages authentication state (user profile, login status)
- **Course Slice**: Handles course-related state (available courses, enrollment status, pagination metadata)
- **UI Slice**: Manages UI-related state (theme, notifications, loading states)
- **Quiz Slice**: Manages quiz-related state (quiz data, submissions, results, video progress)
- **Assignment Slice**: Manages assignments and user submission history

## Authentication Flow & Security

The authentication system relies on **Dual HttpOnly Cookie Authentication** (`accessToken` & `refreshToken`) supported by silent token refresh:

1. **Cookie Transmission**: `credentials: 'include'` is set globally on all API requests in `lib/api-client.ts`.
2. **Token Store**: Zero access or refresh tokens are stored in `localStorage` or `sessionStorage`, protecting the application against XSS token extraction.
3. **Silent Token Refresh Interceptor**: When an API request receives a 401 Unauthorized status, `apiClient` automatically triggers a silent refresh call to `/auth/refresh-token` (or `/auth/refresh`) and retries the original request seamlessly.
4. **Protected Routes**: Server-side Next.js `middleware.ts` checks the `isLoggedIn` cookie flag to enforce route protection.

## API Integration & Response Envelope

1. **Centralized HTTP Client**: `lib/api-client.ts` standardizes API interaction across all services.
2. **Response Envelope Unwrapping**: Automatically unwraps `{ success: boolean, data: T, message?: string, error?: string }` while supporting flat payload fallbacks.
3. **Arabic Error Formatting**: Handles network errors (`TypeError: Failed to fetch`) and HTTP 429 rate limits with clear, user-facing Arabic error messages.

---

## 🎯 Verification & Acceptance Summary

### 1. Refactored Modules
- **Core API Client**: `lib/api-client.ts` updated with `credentials: 'include'`, silent 401 token refresh interceptor, and formatted Arabic error handling.
- **Auth Module**: `services/authService.ts`, `app/login/page.tsx`, `app/register/page.tsx`, `components/navbar.tsx` refactored to use HttpOnly cookies and `getCurrentUser()`.
- **Courses Module**: `services/courseService.ts`, `store/slices/courseSlice.ts`, `app/course/[id]/page.tsx`, `app/grades/*`, `components/enrollment-card.tsx` refactored to remove all direct `localStorage` token reads.
- **Quizzes & Video Progress Module**: `services/quizService.ts`, `store/slices/quizSlice.ts`, `app/course/[id]/video/[video]/page.tsx` updated for `/progress/mark` and `/quizzes/submit`.
- **User Dashboard & Subscriptions**: `services/userService.ts`, `app/me/user/*`, `app/course/[id]/subscribe/invoice/page.tsx` synchronized with backend schemas.

### 2. Next Action Items
- Run end-to-end user testing with live backend (`http://localhost:3005`).
- Deploy updated frontend build to staging environment.