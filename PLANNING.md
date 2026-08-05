# E-LRN Frontend — Execution Planning

**Branch:** `feature/phase-2-3-service-redux-layer`
**API Reference:** `C:\Users\os\Desktop\e-learning-platform\API_DOCUMENTATION.md`
**Implementation Plan:** [implementation_plan.md](./implementation_plan.md)

---

## Project Requirements

- Migrate to new backend API response envelope (`{ success, data, meta }` for lists, `{ success: false, error: "..." }` for errors)
- Centralize all API communication through a single typed HTTP client
- Replace `refreshToken`-in-localStorage auth with in-memory `accessToken` token management
- Add server-side route protection via Next.js `middleware.ts`
- Handle HTTP 429 rate-limiting with Arabic user-facing messages
- Fix grade enum values: `FIRST_SECONDARY | SECOND_SECONDARY | THIRD_SECONDARY`
- Fix new endpoint changes:
  - `/enroll/status` (was `/enroll/api/enrollment-status`), body now `{ courseId }` only
  - `/progress/mark` (was `/progress/complete`), body now `{ videoId, completed: true }`
- Enable Next.js image optimization (remove `unoptimized: true`)
- Provide backend documentation for future HttpOnly cookie migration

---

## Full Task List

### Phase 0 — Foundation

| # | Task | File(s) | Status |
|---|---|---|---|
| P0-1 | Create `.env.local` with `NEXT_PUBLIC_API_URL` | `.env.local` | ✅ Done |
| P0-2 | Create `types/api.ts` — shared typed API response interfaces | `types/api.ts` | ✅ Done |
| P0-3 | Create `lib/errors.ts` — typed error classes | `lib/errors.ts` | ✅ Done |
| P0-4 | Create `lib/api-client.ts` — central HTTP client with in-memory token, 429 handling, envelope parsing | `lib/api-client.ts` | ✅ Done |
| P0-5 | Update `next.config.js` — remove `unoptimized: true`, add remotePatterns | `next.config.js` | ✅ Done |

### Phase 1 — Auth Layer Refactor

| # | Task | File(s) | Status |
|---|---|---|---|
| P1-1 | Rewrite `services/authService.ts` — use `apiClient`, in-memory token, new API shape | `services/authService.ts` | ✅ Done |
| P1-2 | Update `store/slices/authSlice.ts` — add `grade`, `phoneNumber` to `User` type, add `initializeAuth` | `store/slices/authSlice.ts` | ✅ Done |
| P1-3 | Create `middleware.ts` — server-side route protection | `middleware.ts` | ✅ Done |
| P1-4 | Update `app/login/page.tsx` — use updated authService, 429 handling, fix `userData.user` → `userData` | `app/login/page.tsx` | ✅ Done |
| P1-5 | Update `app/register/page.tsx` — fix grade enums (already correct), 429 handling | `app/register/page.tsx` | ✅ Done |
| P1-6 | Update `app/page.tsx` — remove `localStorage.getItem('refreshToken')`, use cookie flag | `app/page.tsx` | ✅ Done |
| P1-7 | Update `app/me/user/page.tsx` — remove inline fetch, use `authService.getCurrentUser()` | `app/me/user/page.tsx` | ✅ Done |
| P1-8 | Create `docs/AUTH_BACKEND_MIGRATION.md` — backend spec for HttpOnly cookie migration | `docs/AUTH_BACKEND_MIGRATION.md` | ✅ Done |
| P1-9 | Update `utils/auth-utils.ts` — align with new error structure | `utils/auth-utils.ts` | ✅ Done |

### Phase 2 — Service Layer

| # | Task | File(s) | Status |
|---|---|---|---|
| P2-1 | Rewrite `services/courseService.ts` — use `apiClient`, new endpoints, pagination support | `services/courseService.ts` | ✅ Done |
| P2-2 | Create `services/quizService.ts` — extract all quiz API calls | `services/quizService.ts` | ✅ Done |
| P2-3 | Create `services/assignmentService.ts` — extract all assignment API calls | `services/assignmentService.ts` | ✅ Done |
| P2-4 | Create `services/userService.ts` — `getCurrentUser()` via apiClient | `services/userService.ts` | ✅ Done |

### Phase 3 — Redux Slices Cleanup

| # | Task | File(s) | Status |
|---|---|---|---|
| P3-1 | Update `store/slices/courseSlice.ts` — thunks call `courseService`, remove inline fetch | `store/slices/courseSlice.ts` | ✅ Done |
| P3-2 | Update `store/slices/quizSlice.ts` — thunks call `quizService`, fix endpoints, remove localStorage | `store/slices/quizSlice.ts` | ✅ Done |
| P3-3 | Update `store/slices/assignmentSlice.ts` — thunks call `assignmentService`, remove N+1 loop, remove localStorage | `store/slices/assignmentSlice.ts` | ✅ Done |

---

## Commit Log

| Commit | Message |
|---|---|
| initial | `chore: create PLANNING.md and feature branch` |
| P0 complete | `feat(foundation): add API client, typed errors, shared types, env config` |
| P1 complete | `feat(auth): rewrite auth layer with in-memory tokens and route middleware` |
| branch | `chore: create feature/phase-2-3-service-redux-layer branch` |
| P2 & P3 complete | `feat(service-redux): complete Phase 2 service layer and Phase 3 Redux slices cleanup` |
