# E-LRN Frontend — Full Cleanup, Security & API Migration Plan

## Summary

A complete refactor and hardening of the `a-e-lrn-frontend` Next.js app to:
1. Fix all critical security issues (token storage, route protection)
2. Migrate to the new backend API response envelope (`{ success, data, meta }`)
3. Eliminate all code duplication (DRY violation between service files and Redux slices)
4. Fix performance issues (image optimization, N+1, client-only pages)
5. Add proper loading states, rate-limit handling, and pagination

---

## User Review Required

> [!IMPORTANT]
> **Auth Strategy**: We agreed to implement **in-memory accessToken + middleware cookie check** as the frontend-side solution, since the backend is not yet ready for HttpOnly cookies. A separate `docs/AUTH_BACKEND_MIGRATION.md` file will document exactly what the backend needs to do to complete the migration.

> [!IMPORTANT]
> **New API Response Envelope**: Every list response now returns `{ success, data, meta }`. All types and Redux slice handlers must be updated. The old `{ message: "..." }` error format is replaced by `{ success: false, error: "..." }`.

> [!WARNING]
> **Grade Enum Change**: Registration now requires `FIRST_SECONDARY | SECOND_SECONDARY | THIRD_SECONDARY` instead of plain strings. The register form must be updated.

> [!WARNING]
> **No Production Deploy**: Everything is in dev, so we have full freedom to refactor without backward-compat concerns.

---

## Proposed Changes

### Phase 0 — Foundation (Dependencies for Everything Else)

#### [NEW] `lib/api-client.ts`
Central HTTP client that:
- Holds the `accessToken` in a module-level variable (in-memory, never localStorage)
- Attaches `Authorization: Bearer <token>` to every request automatically
- Parses the new `{ success, data, error }` envelope and throws structured errors
- Handles **HTTP 429** by reading `Retry-After` header and returning a typed `RateLimitError`
- Handles **401** by attempting a silent token refresh, then retrying the original request once
- Exports `apiClient.get()`, `apiClient.post()`, `apiClient.put()`, `apiClient.delete()`

#### [NEW] `lib/api-config.ts`
Single source of truth for API URL:
```ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';
```

#### [NEW] `lib/errors.ts`
Typed error classes: `ApiError`, `RateLimitError`, `AuthError`, `NotFoundError`.

#### [MODIFY] `.env.local` (create if not exists)
```
NEXT_PUBLIC_API_URL=http://localhost:3005
```

---

### Phase 1 — Auth Layer Refactor

#### [MODIFY] `services/authService.ts`
- Remove all `localStorage` token storage
- Store `accessToken` only in the in-memory `api-client.ts` module variable
- Store only a **non-sensitive** `isLoggedIn=true` flag in `localStorage` for middleware to read on page reload
- `loginUser()` → calls `/auth/login`, sets in-memory token, stores flag
- `logoutUser()` → clears in-memory token + flag
- `refreshAccessToken()` → new function, calls `/auth/refresh` with `credentials: 'include'` (for refreshToken cookie when backend is ready), or throws `AuthError`
- Handles **new response envelope**: extract `data` from `{ success, data }`

#### [MODIFY] `store/slices/authSlice.ts`
- Add `grade` field to `User` interface (new API returns it)
- Remove any localStorage reads from the slice itself

#### [NEW] `middleware.ts` (at project root, `a-e-lrn-frontend/middleware.ts`)
- Protect routes: `/me/*`, `/course/*`
- Read the `isLoggedIn` cookie/flag; if absent → redirect to `/login`
- Public routes: `/`, `/login`, `/register`, `/grades/*`

#### [NEW] `docs/AUTH_BACKEND_MIGRATION.md`
Documents exactly what the backend needs to implement for the full HttpOnly cookie migration (Set-Cookie on login, /auth/refresh endpoint, CORS credentials config).

---

### Phase 2 — Service Layer (Single Source of Truth for All API Calls)

#### [MODIFY] `services/authService.ts`
_(already covered in Phase 1)_

#### [MODIFY] `services/courseService.ts`
- All functions use `apiClient` from `lib/api-client.ts`
- Handle new paginated response: `fetchAllCourses(page?, limit?)` → returns `{ data: Course[], meta: PaginationMeta }`
- Update `checkEnrollmentStatus` and `enrollInCourse` for new envelope

#### [NEW] `services/quizService.ts`
Extract all quiz-related API calls out of `quizSlice.ts` into a dedicated service:
- `fetchQuizzesByCourse(courseId)`
- `fetchQuizById(quizId)`
- `submitQuizAnswers(quizId, answers)`
- `fetchQuizResults(quizId)`
- `fetchQuizStatus(quizId)`
- `fetchVideoProgress(videoId)`
- `completeVideo(videoId)`

#### [NEW] `services/assignmentService.ts`
Extract all assignment-related API calls out of `assignmentSlice.ts`:
- `fetchAssignmentsByVideo(videoId)`
- `fetchAssignmentById(assignmentId)`
- `submitAssignment(assignmentId, payload)`
- `fetchAssignmentStatus(assignmentId)`
- `fetchAllSubmissions()`

#### [NEW] `services/userService.ts`
- `getCurrentUser()` — uses `apiClient`, returns typed `User`

---

### Phase 3 — Redux Slices Cleanup

#### [MODIFY] `store/slices/courseSlice.ts`
- Remove all inline `fetch()` calls from thunks
- Thunks now call `courseService` functions
- Update `Course` interface for new API response shape (add pagination support)

#### [MODIFY] `store/slices/quizSlice.ts`
- Remove all inline `fetch()` calls from thunks
- Thunks now call `quizService` functions
- Remove all `localStorage.getItem('refreshToken')` reads

#### [MODIFY] `store/slices/assignmentSlice.ts`
- Remove all inline `fetch()` calls from thunks
- Thunks now call `assignmentService` functions
- Remove all `localStorage.getItem('refreshToken')` reads
- Remove the N+1 loop in `fetchAssignmentsByCourse` — replace with a single service call

---

### Phase 4 — Page & Component Updates

#### [MODIFY] `app/page.tsx`
- Convert from `'use client'` to a **Server Component**
- Extract the `isLoggedIn` conditional CTA button into a `components/hero-cta.tsx` Client Component

#### [MODIFY] `app/login/page.tsx`
- Update form submission to use new `authService.loginUser()`
- Handle `RateLimitError` → show Arabic "لقد تجاوزت عدد المحاولات المسموح بها، حاول مرة أخرى بعد X ثانية"
- Handle new `{ success: false, error }` error shape

#### [MODIFY] `app/register/page.tsx`
- Update `grade` field to use a `<Select>` with enum values:
  - `FIRST_SECONDARY` → "الصف الأول الثانوي"
  - `SECOND_SECONDARY` → "الصف الثاني الثانوي"
  - `THIRD_SECONDARY` → "الصف الثالث الثانوي"
- Handle `RateLimitError`

#### [MODIFY] `app/me/user/page.tsx`
- Remove inline `fetch()` call — use `userService.getCurrentUser()` via Redux or direct service call
- Remove `localStorage.getItem('refreshToken')` — auth is now handled by `api-client.ts`

#### [MODIFY] `app/course/[id]/page.tsx`
- Remove all direct `localStorage` reads
- Use updated Redux thunks (which now call service layer)
- Handle paginated responses

---

### Phase 5 — Performance & UX

#### [MODIFY] `next.config.js`
- Remove `images: { unoptimized: true }` — enable Next.js image optimization
- Add `images.remotePatterns` if videos/images are hosted externally

#### [NEW] `app/course/[id]/loading.tsx`
Skeleton screen for the course detail page.

#### [NEW] `app/me/user/loading.tsx`
Skeleton screen for the user dashboard.

#### [NEW] `app/grades/[grade]/loading.tsx`
Skeleton screen for the grades page.

---

### Phase 6 — Type Safety

#### [NEW] `types/api.ts`
Shared TypeScript types matching the new backend:
```ts
interface ApiResponse<T> { success: boolean; data: T; }
interface PaginatedResponse<T> { success: boolean; data: T[]; meta: PaginationMeta; }
interface PaginationMeta { total: number; page: number; limit: number; totalPages: number; }
interface ApiError { success: false; error: string; }
```

---

## Verification Plan

### Automated Tests
- `npm run build` — must pass with zero TS errors and zero lint errors (after removing `ignoreDuringBuilds: true`)
- `npm run lint` — must pass

### Manual Verification
| Flow | Steps |
|---|---|
| Login | Visit `/login`, submit credentials, verify redirect to `/me/user` |
| Register | Visit `/register`, submit with grade dropdown, verify account created |
| Route Guard | Visit `/me/user` while logged out → verify redirect to `/login` |
| Course List | Visit `/grades/1`, verify paginated courses load |
| Course Detail | Click a course, verify videos/quizzes/assignments render |
| Quiz Submit | Submit a quiz, verify results dialog appears |
| Assignment Submit | Submit an MCQ assignment, verify grade returned |
| Logout | Click logout, verify token cleared and redirect to `/` |
| Rate Limit | Send 11+ login attempts, verify Arabic 429 message appears |
