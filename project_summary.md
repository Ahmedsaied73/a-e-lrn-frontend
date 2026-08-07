# 📚 E-LRN Frontend — Project Summarization
> **Platform**: Mr. Lotfy Zahran Educational Platform (الأستاذ لطفي زهران)
> **Last Reviewed**: August 2026

---

## 🎯 What Is This Project?

This is an **Arabic-language e-learning platform** for a math teacher named **Mr. Lotfy Zahran**, targeting Egyptian high school students (Grades 1–3 of Secondary). The platform allows students to:

- Browse and enroll in math courses by academic grade
- Watch lecture videos
- Take **quizzes** linked to specific videos (unlocked after watching)
- Submit **assignments** (both MCQ and open-ended)
- Track their grades and exam results from a personal dashboard

The UI is built **RTL (right-to-left)** and uses the **Cairo** Arabic font. The entire platform is in Arabic.

---

## 🏗️ Architecture Overview

```
E-LRN-FRONTEND/
└── a-e-lrn-frontend/         ← Next.js App
    ├── app/                  ← App Router pages
    │   ├── page.tsx          ← Landing/Home page
    │   ├── login/            ← Login page
    │   ├── register/         ← Registration page
    │   ├── grades/           ← Grade browsing (1, 2, 3)
    │   ├── course/[id]/      ← Course detail + video player + quiz/assignment
    │   └── me/user/          ← Student dashboard
    │       ├── courses/       ← Enrolled courses
    │       ├── assignments/   ← Assignments list
    │       ├── exam-results/  ← Single exam results
    │       └── all-exam-results/ ← History of all results
    ├── components/            ← Reusable UI components
    │   ├── navbar.tsx
    │   ├── footer.tsx
    │   ├── enrollment-card.tsx
    │   ├── QuizResultsDialog.tsx
    │   └── ui/               ← Shadcn/Radix UI components
    ├── services/              ← API abstraction layer
    │   ├── authService.ts
    │   └── courseService.ts
    ├── store/                 ← Redux Toolkit global state
    │   └── slices/
    │       ├── authSlice.ts
    │       ├── courseSlice.ts
    │       ├── quizSlice.ts
    │       ├── assignmentSlice.ts
    │       └── uiSlice.ts
    └── hooks/                 ← Custom React hooks
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 13.5** (App Router) |
| Language | **TypeScript 5.2** |
| Styling | **Tailwind CSS 3.3** + **Shadcn UI** + **Radix UI** |
| State Management | **Redux Toolkit 2.6** + **React Redux 9** |
| Forms | **React Hook Form 7.53** + **Zod 3.23** |
| HTTP | Native `fetch()` API |
| Auth | **JWT** stored in `localStorage` |
| Video Player | **react-player 2.16** |
| Charts | **Recharts 2.12** |
| Font | **Cairo** (Google Fonts — Arabic subset) |
| Icons | **Lucide React** |

---

## 🔐 Security Audit Report

> As a **Lead Security Engineer**, here is the honest assessment:

### [CRITICAL] JWT stored in `localStorage`
- **Files**: [`authService.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/services/authService.ts#L41-L58), [`courseSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/courseSlice.ts#L50-L57)
- The `refreshToken` is stored directly in `localStorage`, which is **vulnerable to XSS attacks**. Any injected script can steal the token.
- **Fix**: Migrate token storage to `HttpOnly` cookies (set by the backend). The frontend should never touch the token directly.

### [CRITICAL] Entire user object stored in `localStorage`
- **File**: [`authService.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/services/authService.ts#L58)
- Line 58: `localStorage.setItem('userData', JSON.stringify(userData))` — stores the full API response including sensitive user data in plaintext.
- **Fix**: Only store the minimum needed (e.g., user ID). Let the backend session/cookie handle authentication.

### [CRITICAL] `refreshToken` used as Bearer token
- **Files**: [`authService.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/services/authService.ts#L110), all thunks in slices
- The `refreshToken` is being sent as the `Authorization: Bearer` header for every API call. This is architecturally incorrect — refresh tokens are meant **only** to get new access tokens, not to authorize API calls.
- **Fix**: The backend should return both an `accessToken` (short-lived) and `refreshToken`. Use the `accessToken` for API calls and silently refresh it when it expires.

### [WARNING] API base URL hardcoded as `localhost`
- **Files**: All slices and both service files
- `http://localhost:3005` is hardcoded in **7+ files**. This means the app is broken in any production/staging environment.
- **Fix**: Move to an environment variable: `process.env.NEXT_PUBLIC_API_URL`.

### [WARNING] No route protection middleware
- **File**: [`app/page.tsx`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/app/page.tsx#L12-L16)
- Authentication is checked with `localStorage.getItem('refreshToken')` inside a `useEffect` on the client. This means protected pages briefly flash before redirecting.
- **Fix**: Use Next.js `middleware.ts` at the root level to redirect unauthenticated users before the page renders.

### [WARNING] ESLint disabled during builds
- **File**: [`next.config.js`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/next.config.js#L5)
- `ignoreDuringBuilds: true` means linting errors are silently ignored in CI/CD. Code quality bugs slip through.
- **Fix**: Remove this flag and fix any lint errors that surface.

### [NITPICK] No CSRF protection on state-changing POSTs
- The `fetch()` calls for enrollment and quiz/assignment submission do not include any CSRF token.
- Since auth is cookie-less, this is less critical for now, but would become a concern if you migrate to `HttpOnly` cookies.

---

## ⚡ Performance Audit Report

> As a **Lead Performance Engineer**, here is the honest assessment:

### [CRITICAL] Next.js Image optimization is disabled
- **File**: [`next.config.js`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/next.config.js#L7)
- `images: { unoptimized: true }` disables Next.js's built-in WebP conversion, resizing, and lazy loading. Every image (teacher photo, grade cards, brain illustration) is served at full size with no optimization.
- **Fix**: Remove this flag. If using an external image host, configure `remotePatterns` in `next.config.js`.

### [CRITICAL] N+1 API problem in `fetchAssignmentsByCourse`
- **File**: [`assignmentSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/assignmentSlice.ts#L108-L140)
- This thunk loops through every `videoId` and fires a **separate fetch per video**. If a course has 20 videos, it makes 20 sequential HTTP requests.
- **Fix**: Ask the backend to add a `GET /assignments/course/:courseId` endpoint that returns all assignments in one call.

### [WARNING] Entire home page is a Client Component
- **File**: [`app/page.tsx`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/app/page.tsx#L1)
- `'use client'` at line 1. The entire landing page (hero, about section, why section, grades) is rendered on the client. This hurts SEO and First Contentful Paint.
- **Fix**: Make the page a Server Component. Only the small "is logged in?" conditional button needs to be a Client Component — extract it into a `<LoggedInCTA />` client sub-component.

### [WARNING] Duplicate API logic — slices AND service files
- Course fetch logic exists in **both** [`courseService.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/services/courseService.ts) **and** [`courseSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/courseSlice.ts#L55-L69). This violates DRY and makes it hard to change the API URL in one place.
- **Fix**: The Redux thunks should call the service functions, not re-implement the fetch themselves.

### [NITPICK] `react-player` is a heavy bundle (~200KB gzipped)
- **File**: [`package.json`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/package.json#L64)
- If videos are hosted on YouTube/Vimeo, consider a lightweight embed wrapper instead.

### [NITPICK] No `loading.tsx` or `Suspense` boundaries
- Next.js App Router supports `loading.tsx` files for automatic skeleton screens. None are present in the route directories.
- **Fix**: Add `loading.tsx` files to `app/course/[id]/` and `app/me/user/` for a better perceived performance.

---

## 🌐 API Communication Map

All API calls hit `http://localhost:3005` (backend on port **3005**).

| Feature | Method | Endpoint |
|---|---|---|
| Login | `POST` | `/auth/login` |
| Register | `POST` | `/auth/register` |
| Get current user | `GET` | `/user/me` |
| List all courses | `GET` | `/courses` |
| Get course by ID | `GET` | `/courses/:id` |
| Check enrollment | `POST` | `/enroll/api/enrollment-status` |
| Enroll in course | `POST` | `/enroll` |
| Get video assignments | `GET` | `/assignments/video/:videoId` |
| Get assignment by ID | `GET` | `/assignments/:id` |
| Submit assignment | `POST` | `/assignments/submit` |
| Check assignment status | `GET` | `/assignments/:id/status` |

---

## 🔄 What To Do If The Backend API Changes

This is the key question. Here's the full process:

### Step 1 — Identify What Changed
Ask the backend developer for:
- ✅ Changed endpoint URLs (e.g., `/auth/login` → `/api/v2/auth/login`)
- ✅ Changed request body fields
- ✅ Changed response shape (field renames, new fields, removed fields)
- ✅ Changed authentication method (e.g., from `refreshToken` to `accessToken`)

### Step 2 — Update the API Base URL (if changed)
Currently hardcoded in 7+ files. The real fix is to create a single source of truth:

```ts
// lib/api.ts  ← CREATE THIS FILE
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
```

Then replace all hardcoded `http://localhost:3005` occurrences to import from `lib/api.ts`.

### Step 3 — Update Service Files First
The two service files are the intended abstraction layer:
- [`services/authService.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/services/authService.ts) → update auth-related endpoints
- [`services/courseService.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/services/courseService.ts) → update course/enrollment endpoints

### Step 4 — Update Redux Slices (They Also Call APIs Directly)
Due to the DRY violation mentioned above, you also need to update the thunks in:
- [`store/slices/courseSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/courseSlice.ts) — `fetchCourses`, `fetchCourseById`, `checkEnrollmentStatus`
- [`store/slices/quizSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/quizSlice.ts) — all quiz thunks
- [`store/slices/assignmentSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/assignmentSlice.ts) — all assignment thunks

### Step 5 — Update TypeScript Interfaces
If the API response shape changes, update the matching interfaces:
- `User` in [`store/slices/authSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/authSlice.ts#L5-L10)
- `Course` in [`store/slices/courseSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/courseSlice.ts#L5-L20)
- `Quiz`, `QuizResult` in [`store/slices/quizSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/quizSlice.ts)
- `Assignment`, `AssignmentResult` in [`store/slices/assignmentSlice.ts`](file:///l:/E-LRN-FRONTEND/a-e-lrn-frontend/store/slices/assignmentSlice.ts)

### Step 6 — Test These Pages Manually
After updating, test these pages in order:
1. `/login` → check auth still works
2. `/` (homepage) → check logged-in/logged-out states
3. `/grades/1` → check grade filter works
4. `/course/[id]` → check course data loads and enrollment works
5. `/course/[id]/video/[videoId]` → check video plays + quiz/assignment loads
6. `/me/user` → check dashboard loads correctly

---

## 🗺️ Pages & Routes Summary

| Route | Description |
|---|---|
| `/` | Landing page — hero, about, why, grades |
| `/login` | Login form |
| `/register` | Registration form (name, email, phone, grade, password) |
| `/grades/[gradeNum]` | Browse courses by grade (1, 2, 3) |
| `/course/[id]` | Course detail — overview, videos list, quiz/assignment list |
| `/course/[id]/subscribe` | Enrollment/subscription page |
| `/course/[id]/video/[videoId]` | Video player + quiz + assignments |
| `/me/user` | Student profile dashboard |
| `/me/user/courses` | My enrolled courses |
| `/me/user/assignments` | My assignments |
| `/me/user/exam-results` | Single exam result details |
| `/me/user/all-exam-results` | Full exam results history |
| `/me/user/subscriptions` | Subscription status |

---

## 📝 Priority Action Items

Before touching any new features, these are the most impactful improvements:

1. **[P0 - Security]** Replace `localStorage` JWT storage with `HttpOnly` cookies (requires backend change too)
2. **[P0 - Architecture]** Move `API_URL` to `.env.local` (`NEXT_PUBLIC_API_URL`)
3. **[P1 - Performance]** Remove `images: { unoptimized: true }` from `next.config.js`
4. **[P1 - Architecture]** Make Redux thunks call the service files instead of fetching directly (fix the DRY violation)
5. **[P2 - Performance]** Convert `app/page.tsx` from client to server component
6. **[P2 - Backend]** Request a `GET /assignments/course/:courseId` endpoint to fix the N+1 problem
7. **[P3 - UX]** Add `loading.tsx` files to route segments for better skeleton loading
