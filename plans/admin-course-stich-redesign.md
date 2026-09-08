# Admin console + course page redesign → Stitch "Academic Precision" (unified light system)

Status: executing · Branch: `Dev` (FE) · Plan date: 2026-09-08

## Goal

Redesign the **admin console (all pages)** and the **student `course/[id]` page** to match Stitch
project **14391907357742829862** ("Navigation Bar Color Update", 9 screens) and its formal
design system **"Academic Precision"** — one light, high-legibility system across the whole app.

## Confirmed decisions (grill round)

| Decision | Choice |
|---|---|
| Assets | Fetch via `@google/stitch-sdk` with user API key → `design-ref/stitch/` (gitignored) ✅ done |
| course/[id] WIP | Redesign **on top of** the user's uncommitted edits — never revert/commit their files |
| Admin scope | **Full console** — shell + sidebars + every admin page |
| Theme | **Light-first unified** — single shadcn/token light set; **remove the `.admin-console` dark scope** |
| Mobile Stitch frames | Inform **responsive** behavior only; no separate mobile routes |

## Source of truth

`design-ref/stitch/<screen>/{index.html,screen.png,fetch-report.json}`, and the formal design
system dump `design-ref/stitch/design-system/ds-*.json` (name "Academic Precision", LIGHT mode).

Key system values (already 90% present in `tailwind.config.ts` + `:root`):

- Primary `#207bff`, secondary `#4ea5ff`, tertiary `#1556b3`; surface bg `#f7f9fc`;
  cards `#ffffff` + 1px `#e1e8f0` border (Level 1, no shadow); interactive shadow
  `0 4 20 rgba(0,0,0,.04)` (level-2); overlays `0 12 32 rgba(0,0,0,.08)` (level-3).
- Tonal layers `surface-container-low #f2f4f7` / `-#ff` text `on-surface #191c1e`, labels `on-surface-variant #414754`, outlines `#727786`/`#c1c6d7`.
- Error: `#ba1a1a`, container `#ffdad6`, on-error-container `#93000a`. Success/warning: emerald/amber desaturated.
- Chips: `#e8f2ff` bg + primary text. Progress bars: 8px pill, `#f5f7fa` track, `#4ea5ff` fill.
- Buttons: primary solid `#207bff` → hover `#0057c0`; secondary outline; ghost text. Radius 8px cards/inputs, 16px large containers, 4px small, pill tags/progress.
- Cairo, body 16/1.6; labels 14/600. Grid 12-col desktop (48px margins), RTL.

## Screen compositions → page mapping

| Stitch screen | Implemented in |
|---|---|
| admin-overview-kpis (+ mobile overview) | `app/admin/page.tsx` |
| admin-users (+ mobile students) | `app/admin/students/page.tsx` |
| admin-courses-enrollments (+ mobile courses) | `app/admin/courses/page.tsx`, `courses/[id]/videos/page.tsx`, `app/admin/enrollments/page.tsx` |
| admin-exams-grading (+ mobile dashboard-grading) | `app/admin/quizzes/*`, `app/admin/grading/page.tsx` |
| course-content-chemistry | `app/course/[id]/page.tsx` (on top of WIP) |

Shared elements from screens: brand bar + grouped nav (عام/الإدارة/التقييم), live-status
pill + search + notifications + user chip topbar, ".قائمة المقررات" tables, KPI strips,
recent-activity columns, quick actions, rubric/grading master-detail, enrollment progress bars.

## Execution steps (land in ordered commits, each compilable)

1. **Commit 1 — tokens + shared admin shell/components (light).**
   - `app/globals.css`: delete `.admin-console` dark scope (keep neutral scrollbars); align global
     `:root` tokens to Academic Precision (`--border 213 37% 91%`, `--muted 214 25% 96%`, `--muted-foreground 218 14% 31%`, `--ring 214 100% 56%`); keep radius.
   - `components/admin/AdminSidebar.tsx`: light shell — white bg, `border-e outline-variant`,
     active item `bg-[#e8f2ff] text-[#0057c0]`, logo chip `bg-[#e8f2ff] text-primary`, brand footer
     "الرجوع للبوابة الرئيسية" + version, user chip light.
   - `components/admin/DataTable.tsx`: tokens (border `outline-variant`, header `muted/40`,
     rows `on-surface`, empty `on-surface-variant`).
   - `components/admin/StatCard.tsx`: white card `border-outline-variant`, icon chip
     `bg-[#e8f2ff] text-primary` (success/warning/danger light tints), value `font-bold`.
   - `components/admin/StatusBadge.tsx`: light chips `bg-*-50 border-*-200 text-*-700` map
     (PENDING/GRADING amber, UPLOADING/PROCESSING/IN_PROGRESS sky, READY/GRADED/PAID/PLACED emerald,
     FAILED red, SUBMITTED/EXPIRED slate, UNPAID amber).
   - `components/admin/ConfirmDialog.tsx` + `components/admin/quiz/*`: drop dark classes → tokens; fix `QuizAuthoringForm.tsx` header `text-slate-900` bug.
   - `app/admin/layout.tsx`: remove now-pointless `-mt-16` claiming, keep guard; light area bg.

2. **Commit 2 — students + courses + videos + enrollments pages** (light filters, dialogs,
   tables; enrollments progress bar → blue pill; badges via StatusBadge).

3. **Commit 3 — quizzes index + authoring + attempts/access + global grading** (light cards,
   master/detail grading per screen).

4. **Commit 4 — dashboard** (`app/admin/page.tsx`): Academic Precision KPI strip, status pill,
   clean alerts, quick actions, three recent-activity columns, revision queue teaser.

5. **Commit 5 — course `[id]` page redesign (on top of WIP):**
   - Keep all hooks/state/services/WIP edits intact; change JSX structure/classes.
   - Academic header: title + verified chip, stats (lessons/duration/exams), description;
   - "محتوى الكورس" unit-style accordion: numbered lesson rows w/ lock/unlock, play_circle
     duration, quiz/file badges, "بدء المشاهدة" for the first/open lesson; keep completed/
     processing/failed badges and assignment cards behavior (`updateVideoList` etc.).
   - Right rail: `EnrollmentCard` stays (already Academic Precision).

6. **Commit 6 — verification:** FE `npx tsc --noEmit`; Playwright flow checks (admin login,
   dashboard, students/courses/enrollments, quizzes, grading, course page w/ seed student) against
   BE `:3005`.

Never touch/commit: `next.config.js`, `services/bunnyVideoService.ts`,
`app/course/[id]/subscribe/*`, `app/course/[id]/video/[video]/*`, `.playwright-cli/`, `docs.md`,
`stitch_*` junk. `design-ref/` is gitignored.

## Scope notes

- No backend changes required; all data endpoints exist.
- "إعدادات النظام" nav item seen on Stitch screens has no backend/admin page — **not shipped**
  (dead links avoided) unless user asks.
- Quick actions on dashboard (add course / enroll student / upload video) wire to existing
  admin routes (courses page, enrollments dialog, courses/[id]/videos).