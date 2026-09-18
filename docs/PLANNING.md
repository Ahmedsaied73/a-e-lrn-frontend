# E-LRN Frontend — Full Backend Integration & Refactoring Plan

**Branch:** `feature/full-backend-integration`  
**Integration Guide:** `C:\Users\os\Desktop\e-learning-platform\FRONTEND_INTEGRATION_GUIDE.md`  
**API Reference:** `C:\Users\os\Desktop\e-learning-platform\API_DOCUMENTATION.md`  

---

## Project Requirements & Integration Directives

- **Cookie Authentication**: All API requests set `credentials: 'include'` for HttpOnly Cookie handling.
- **Silent Refresh**: On 401 Unauthorized, automatically attempts silent token refresh via `/auth/refresh-token` (with fallback to `/auth/refresh`).
- **Response Envelope**: Standardized handling of `{ success: boolean, data: any, message?: string, error?: string }`.
- **Zero LocalStorage Tokens**: Completely eliminated legacy `localStorage` token reads across services, Redux thunks, pages, and UI components.
- **Vertical Slicing**: Integrated and verified feature-by-feature (Auth -> Courses -> Quizzes -> User Profile -> Payments).
- **RTL Compatibility**: UI layout properties use Tailwind logical utilities.

---

## Task Checklist & Execution Status

### Phase 0 — Core API Client Infrastructure

| # | Task | Target File | Status |
|---|---|---|---|
| P0-1 | Add `credentials: 'include'`, silent 401 refresh, and Arabic network error formatting | `lib/api-client.ts` | ✅ Done |
| P0-2 | Synchronize shared response types & domain interfaces | `types/api.ts` | ✅ Done |

### Phase 1 — Auth Module Integration

| # | Task | Target File | Status |
|---|---|---|---|
| P1-1 | Update `authService.ts` for HttpOnly cookie auth & `getCurrentUser` | `services/authService.ts` | ✅ Done |
| P1-2 | Update `authSlice.ts` to clear local token state & handle cookie session | `store/slices/authSlice.ts` | ✅ Done |
| P1-3 | Refactor `/login` page error notifications & submit flow | `app/login/page.tsx` | ✅ Done |
| P1-4 | Refactor `/register` page form submission & error handling | `app/register/page.tsx` | ✅ Done |

### Phase 2 — Courses Module Integration

| # | Task | Target File | Status |
|---|---|---|---|
| P2-1 | Update `courseService.ts` for envelope parsing & `/enroll/status` | `services/courseService.ts` | ✅ Done |
| P2-2 | Update `courseSlice.ts` thunks and state handlers | `store/slices/courseSlice.ts` | ✅ Done |
| P2-3 | Refactor course detail page (`/course/[id]`) to remove direct `localStorage` | `app/course/[id]/page.tsx` | ✅ Done |
| P2-4 | Refactor grade pages (`/grades/[grade]`) to use centralized `courseService` | `app/grades/[gradeNum]/page.tsx` | ✅ Done |

### Phase 3 — Quizzes & Video Progress Module Integration

| # | Task | Target File | Status |
|---|---|---|---|
| P3-1 | Update `quizService.ts` for `/progress/mark` and `/quizzes/submit` | `services/quizService.ts` | ✅ Done |
| P3-2 | Update `quizSlice.ts` thunks and state | `store/slices/quizSlice.ts` | ✅ Done |
| P3-3 | Refactor video player page (`/course/[id]/video/[videoId]`) | `app/course/[id]/video/[videoId]/page.tsx` | ✅ Done |

### Phase 4 — User Profile & Dashboard Integration

| # | Task | Target File | Status |
|---|---|---|---|
| P4-1 | Update `userService.ts` & dashboard pages | `services/userService.ts`, `app/me/user/*` | ✅ Done |

### Phase 5 — Payments & Subscriptions Integration

| # | Task | Target File | Status |
|---|---|---|---|
| P5-1 | Update invoice and subscription management pages | `app/course/[id]/subscribe/*`, `app/me/user/subscriptions/*` | ✅ Done |

---

## Commit Log

| Commit | Message |
|---|---|
| initial | `chore: create feature/full-backend-integration branch and PLANNING.md` |
| core & auth | `feat(api): refactor HTTP client to credentials include, silent 401 refresh, and Arabic network errors` |
| full integration | `feat(integration): complete full-stack API contract synchronization across all modules` |
