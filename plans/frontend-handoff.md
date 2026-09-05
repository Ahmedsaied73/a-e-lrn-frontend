# Shared Brain — E-LRN Platform (Backend ⇄ Frontend)

> Single source of truth for the **security round 1** work. Read this before
> touching any frontend code related to auth, gates, assignments, or admin pages.
> Written by the backend agent so the frontend agent (possibly behind on context)
> shares the same intent, facts, and task list.

---

## 1. Project context (refresh)

- Egyptian secondary-school e-learning platform. Two parallel video systems: **Bunny.net Stream** (`BunnyVideo`, the ACTIVE student-facing one) and a legacy `Video` model (used for `/stream` + assignments). **Almost all FE flow uses Bunny.**
- **Backend**: `H:\e-learning-platform` — Express + Prisma/MySQL, port **3005**, repo branch **Dev**. CommonJS (`require`).
- **Frontend**: `L:\E-LRN-FRONTEND\a-e-lrn-frontend` — Next.js App Router + TypeScript + Redux Toolkit, repo branch **Dev**.
- **Response envelope**: `{ success, data }` — `lib/api-client.ts` unwraps it automatically.
- **Auth transport**: HttpOnly cookies (`credentials: 'include'` everywhere). No Bearer tokens in normal flow.

---

## 2. Auth model — YOU MUST KNOW THIS (round 1, BACKEND CHANGE)

The backend now returns **NO `token`/`refreshToken` in JSON bodies**. All auth rides HttpOnly cookies.

| Cookie | Purpose | Path | MaxAge |
|--------|---------|------|--------|
| `accessToken` | short-lived access JWT | `/` | 15 min |
| `refreshToken` | 7-day refresh JWT, rotated | `/auth` | 7 days |

Consequences for the FE (already implemented, **do not regress**):

1. `services/authService.ts` — `loginUser`/`registerUser` send credentials, then set `document.cookie = "isLoggedIn=true; ...` and confirm via `getCurrentUser()` (`/user/me`). They **never read `data.token`**.
2. `lib/api-client.ts` — keeps an in-memory `setAccessToken`/Bearer store as a compat shim but **never populates it**. 401 → `attemptSilentRefresh()` POSTs `/auth/refresh-token` with cookies (no body), then retries once.
3. Any code that used `response.token` from login is **dead/broken by design** — that also applies to cookie-less CLI clients.
4. Old JWTs (issued before the `type` claim existed) are rejected → users get one forced re-login. This is intended.
5. Refresh tokens include a `jti` nonce; `/auth/refresh-token` **rotates** (new refresh persisted + cookie re-set). Never try to "reuse" a refresh token.

JWT `type` claims: access = `{ type: 'access' }`, refresh = `{ type: 'refresh' }`. The refresh endpoint rejects access tokens; `authenticateToken` rejects refresh tokens. **A refresh token can never auth an API route — do not write FE logic that relies on that.**

---

## 3. Backend changes (round 1) — committed on backend `Dev`

| Commit | What |
|--------|------|
| `ea97a4c` | Cookie-only auth: dedicated `REFRESH_TOKEN_SECRET` (+ placeholder guard), `type` claims, refresh rotation, no tokens in bodies, `scripts/uploadDemoVideos.js` switched to cookie extraction |
| `14cafce` | `jti` nonce on refresh tokens (same-second rotation produced identical tokens — fixed and live-verified) |
| `eee12cb` | `getAssignment` strips `correctOption`/`explanation` for students pre-submission (answer-key leak closed) |
| `b100650` | `markVideoCompleted` **unlock precondition** (first video or previous completed) + **structured 403 `code`s** |
| `168018d`+`d6eccbc` | Docs/memory | 

---

## 4. Frontend work so far

### Committed on frontend `Dev`

| Commit | What |
|--------|------|
| `3b6a1fe` | Auth pairing: `authService` no body-token dependency, `isLoggedIn` from `/user/me`, `api-client` cookie-only refresh |
| `44932ce` | `app/admin/layout.tsx` — role-guards ALL `/admin/**` (non-ADMIN → redirect; shows "جارٍ التحقق" while `auth.initialized` is false) |
| `dad5a86` | Removed "نتائج الواجب" link from profile (`app/me/user/page.tsx`) |
| `9629c58` | `types/quiz.ts` — `QuizGate403.code?: 'SEQUENTIAL_GATE' \| 'NOT_ENROLLED' \| 'VIDEO_NOT_FOUND'` |

### Done but UNCOMMITTED (riding in user WIP working tree — do NOT commit others' WIP)

These edits live in files the user is actively editing. They are finished. When the user commits their WIP, these go with it. Do not redo them:

- `app/course/[id]/video/[video]/page.tsx`:
  - **Removed the "الواجبات المتاحة" (assignments) section** + the `fetchAssignmentsByVideo` dispatch + the `selectAssignments` selector.
  - **Structured-code consumption**: on playback 403, branch on `body.code === 'SEQUENTIAL_GATE'` (falls back to legacy `'quizId' in body` when `code` is absent) → `setQuizGate`; otherwise `setIsNotEnrolled`.
  - On `/progress/complete` 403 `VIDEO_NOT_UNLOCKED` → friendly Arabic message "أكمل المحاضرة السابقة أولاً…".
- `app/course/[id]/page.tsx`: **removed the `fetchAssignmentsByCourse` dispatch** so assignments never load anywhere (all assignment UI self-hides from empty state). The `findAssignmentsForVideo`/status helpers left inert on purpose (minimal diff on WIP).

---

## 5. Error contract — 403 `code`s the backend now sends (round 1)

The backend adds a machine-readable `code` to 403/404 bodies (kept alongside existing `message`/`error`/gate fields).

| code | source | FE meaning |
|------|--------|-----------|
| `NOT_ENROLLED` | sequential access, progress | unenrolled → show subscribe CTA |
| `SEQUENTIAL_GATE` | playback, access | quiz/video gate blocked → also has `quizId`, `yourScore`, `requiredScore`, `previousVideoId` → show QuizGate lock card |
| `ASSIGNMENT_REQUIRED` | legacy gate | (legacy courses only — not surfaced in FE) |
| `ASSIGNMENT_PENDING` | legacy gate | — |
| `ASSIGNMENT_REJECTED` | legacy gate | — |
| `VIDEO_NOT_FOUND` | progress, access | video missing |
| `VIDEO_NOT_UNLOCKED` | `/progress/complete` | previous video not completed → message above |

**Do not regress to `'quizId' in body` string-sniffing as the primary mechanism** (the fallback may stay only as legacy tolerance).

---

## 6. Intent — why this round exists

- **XSS surface reduction**: tokens never reach JS memory (no `data.token` reads) → HttpOnly cookies only.
- **Replay protection**: refresh rotation + `jti` + dedicated secret → a stolen refresh token can't silently replay.
- **Client not trusted**: video completion is only accepted for the currently-unlocked video.
- **No key leaks**: students can't read answer keys before submitting.
- **Guarded admin surface** until you remove/replace the admin sites.
- **Assignments**: hidden FE-only for now (backend + legacy gate untouched; legacy courses aren't reachable in the Bunny flow).

---

## 7. Open items for the FRONTEND agent (task list)

Priority order. Each = one commit on `Dev`. Do not redo items in §4.

### T1 — Verify round 1 in the browser (VERIFY gate) ⚠️ highest value
Why: the whole round is unproven in a real browser.
How: Playwright. Flows:
1. Login sets HttpOnly cookies, no tokens in the network response body.
2. `isLoggedIn` cookie set; `/user/me` populates Redux; navbar shows the user.
3. Visit an admin URL while logged in as a STUDENT → redirected to `/`.
4. Visit a locked (gated) video as an enrolled student → QuizGate lock card with yourScore/requiredScore (branch on `code === 'SEQUENTIAL_GATE'`).
5. On `video/[video]` page: assignments section absent; "بدء الواجب" gone everywhere.
6. Click "إكمال المحاضرة" on the FIRST video → success; on a later video without completing the previous → error notification with the `VIDEO_NOT_UNLOCKED` message.
7. Silent refresh: wait for 401 (or force by deleting `accessToken` cookie, keeping `refreshToken`) → request auto-retries successfully.
Acceptance: scripted checks pass; screenshots saved. Note the backend dev server must be restarted first (it predates the `jti` fix).

### T2 — CSP + security headers (round 2, #7)
Why: no Content-Security-Policy / basic headers on the Next app; the sanitizer in the codebase is hand-rolled (risky).
How: add `headers()` to `next.config.js`: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options`. CSP must allow the Bunny embed host + Google Fonts + SurveyJS. Verify the quiz runner + Bunny iframe still load after.

### T3 — `/courses/enrolled` shape (#9) — only if in scope for this sprint
The FE reads `{ id (enrollment id), createdAt, course }` and flattens; the backend returns enrollment rows. If backend changes shape, FE must pair. Currently deferred — don't start without a green light.

### T4 — Admin sites (user-deployed)
The user plans to REMOVE/replace the admin sites. Keep the `app/admin/layout.tsx` guard as-is; **do not invest new admin features/UI.**

---

## 8. Conventions & gotchas for the FE agent

- Redux: slices in `store/slices/*`; thunks delegate to `services/*`; `apiClient` unwraps envelopes.
- Arabic UI strings everywhere (`dir="rtl"`, Cairo font). No English UI copy except code/comments.
- `services/bunnyVideoService.ts` + `app/course/[id]/*` carry **uncommitted user WIP** — make surgical edits only, never `git add -A`, never commit those files into your own commits.
- Never re-add `fetchAssignmentsByVideo` / `fetchAssignmentsByCourse` dispatches.
- Verify with `npx tsc --noEmit`.
- Messages: keep the legacy `'quizId' in body` fallback ONLY for older backend tolerance.
- The legacy `Video`/assignments gate checks on the backend remain — they do NOT render in FE (Bunny flow). Do not "fix" the backend gate from the FE side.