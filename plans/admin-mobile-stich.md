# Admin Mobile + Course Page — Stitch "Academic Precision" (Mobile) Implementation

Date: 2026-09-08 · Branch: `Dev` · Repo: a-e-lrn-frontend

## Goal

The admin console currently has **no mobile experience** (fixed `w-64` sidebar dominates
phones; C5 was desktop-only). The student `course/[id]` page also needs restyling to the
new Stitch frame. Deliver, in order:

1. Mobile admin shell (top app-bar + bottom nav, 4 tabs) — the frames `_1`–`_4` are one
   connected system the user confirmed they want complete.
2. Mobile variants for all 4 admin tabs: نظرة عامة (`_4`), الطلاب (`_3`), المقررات (`_2`),
   التصحيح (`_1`).
3. `course/[id]` student page redesign to `_5`.

Reference: `C:\Users\Ahmed Saied\Downloads\stitch_navigation_bar_color_update\{_1.._9\code.html}` + `academic_precision\DESIGN.md`.

## Design decisions (grill notes)

- **Breakpoint**: mobile shell/sidebar flip below `lg` (1024px). Sidebar `hidden lg:flex`,
  mobile shell `hidden lg:hidden` covers phone + portrait tablet. Desktop admin untouched.
- **Two parallel render trees per page**: desktop tree wrapped `hidden lg:block`, new mobile
  tree `lg:hidden`. Shared at the top (data fetch, handlers, dialogs) to avoid logic
  duplication. This is the pragmatic interpretation of "no matter what components".
- **Icons**: Frames use Material Symbols; the FE standard is lucide-react (handoff §99.5),
  so map symbols → lucide equivalents (LayoutDashboard, Users, BookOpen/School,
  ClipboardCheck, Bell, Upload, PersonPlus, TrendingUp, Gauge, FlaskConical…).
- **Colors**: keep the approved FE light tokens. Solid fills → `bg-primary` (#207bff);
  deep-blue accents/text-active → `text-[#0057c0]`; tinted chips → `primary-fixed`
  (#d8e2ff)/`secondary-fixed`/`tertiary-fixed`; cards `bg-surface-container-lowest`,
  rows/tracks `bg-surface-container-low`; surface `#f7f9fc`, border `outline-variant/70`.
  No `dark:` or `.admin-console`.
- **Frame numbers that are decorative copies** (revenue 3,450 ج.م, 94.8% overall
  completion, 24 ms latency, "فودافون كاش/بطاقة بنكية") are replaced with **data-honest
  derivations** from real endpoints:
  - completion% → `videos.READY / videos.total` (معدل جاهزية المحتوى)
  - revenue → إجمالي الاشتراكات (`counts.enrollments`), المحاضرات → `counts.videos`,
    الدورات → `counts.courses`, طلاب → `counts.students`
  - grades stats → `counts.attempts.{GRADING,GRADED}` + `counts.quizzes`
  - payment chips → `isPaid`, progress bars → enrollment `progress` (via `getAdminEnrollments`)
- **Users-list "كود الدخول"** (no such data) → render `#id` chip. **حالة "نشط/مسودة"**
  (no draft flag) → derive: courses with 0 videos show "قيد التجهيز", else "نشطة".
- **course/:id design**: replace accordion rows with frame `_5` lesson cards. All fetch
  logic, Redux, `videoProgressMap`, assignment wiring **preserved as-is**. Filter tabs
  group only if the course payload exposes a grouping field; otherwise render the single
  "جميع المحاضرات (N)" tab. Never touch the user-WIP files
  (`app/course/[id]/subscribe/page.tsx`, `app/course/[id]/video/[video]/page.tsx`).
- Safe-area: tiny `.pt-safe`/`.pb-safe` CSS in globals.css (light-only).

## Milestones (commit per milestone, explicit paths only)

### M1 — Mobile admin shell
- `components/admin/MobileShell.tsx` (new):
  - `AdminMobileHeader`: fixed, `lg:hidden`, `pt-safe`, `bg-surface/80 backdrop-blur-xl`,
    h-16, person tile + "أكاديمية الكيمياء" / "لوحة التحكم" + Bell with error dot.
  - `AdminMobileNav`: fixed bottom `pb-safe`, 4 links (/admin, /admin/students,
    /admin/courses, /admin/grading), active `text-[#0057c0] font-bold`; التصحيح badge =
    `counts.attempts.GRADING` via one `getAdminDashboard()` (hidden on failure).
- `app/admin/layout.tsx`: sidebar `hidden lg:flex`; content wrapper `pt-16 lg:pt-0`,
  renders `<AdminMobileHeader/>` + `<main className="pb-24 lg:pb-0">{children}</main>`
  + `<AdminMobileNav/>`.
- `app/globals.css`: `.pt-safe`, `.pb-safe`.
- `tsc` + mobile/desktop spot-check → commit.

### M2 — Dashboard mobile (`_4`)
- `app/admin/page.tsx`: desktop JSX stays but `hidden lg:block`; new `lg:hidden` tree uses
  the same `data` state:
  - health banner (academy/server status) · hero stat card (bg-primary, completion% +
    +newStudents7d delta) · KPI 2×2 grid (4 cards, tinted icon chips + pills) · quick
    actions (add_circle/ticket, person_add, cloud_upload → real routes) · 3 activity cards
    (recent.users / recent.enrollments / recent.attempts with score% + progress bar) ·
    motivation micro-card (FlaskConical tile + derived insight line).
  - mobile loading skeleton.
- `tsc` + 390×844 screenshot → commit.

### M3 — Students mobile (`_3`)
- `app/admin/students/page.tsx`: mobile header (title + add-student button, opens the
  existing add dialog) · 3-col metrics band (إجمالي الأعضاء = users total, نشط/جدد =
  `counts.newStudentsLast7d`, نسبة التسليم = enrollments/students% — one dashboard call)
  · search input + filter pills (الكل / طلاب / مشرفون / الثالث الثانوي → real role/grade
  params) · student cards (avatar initials + online-ish dot, name + #id, email, grade,
  last-login line, edit/delete + courses-dialog actions) · mobile "عرض المزيد" (appends
  next page). Desktop tree unchanged (`hidden lg:block`).
- `tsc` + screenshot → commit.

### M4 — Courses mobile (`_2`)
- `app/admin/courses/page.tsx`: mobile header · dual actions (دورة جديدة → create dialog,
  تسجيل طالب → /admin/students) · 2×2 bento metrics (اشتراكات, فيديوهات جاهزة, محاضرات,
  دورات متاحة — dashboard counts) · course cards (FlaskConical tile, title, status pill,
  description, group/smart_display meta chips, price, videos/edit/delete actions) ·
  أحدث التسجيلات والتقدم (via `getAdminEnrollments` limit 4 → real progress bars +
  isPaid chips).
- `tsc` + screenshot → commit.

### M5 — Grading mobile (`_1`)
- `app/admin/grading/page.tsx`: mobile header (+ pulse dot) · 3-col stats band (dashboard
  counts: GRADING / GRADED / quizzes) · urgent chips (المهام العاجلة (N) / الكل / مصححة →
  filters) · attempt cards restyled to frame style (avatar, name, quiz line, status pill,
  meta row, فتح الإجابات) · the detail/GradingForm column already stacks below `lg` →
  ensure it's usable on mobile. Desktop tree unchanged.
- `tsc` + screenshot → commit.

### M6 — course/[id] student page (`_5`)
- `app/course/[id]/page.tsx`: keep every hook/fetch/handler; replace the render:
  - breadcrumb (icons + chevrons) · header card (rounded-2xl border, "محتوى الدورة
    والوحدات التعليمية" + "{N} محاضرة" badge + verified "منهج معتمد" chip + subtitle) ·
    filter tabs (جميع المحاضرات primary; grouping only if data exposes it) · lesson cards:
    right accent bar (first = emerald معاينة مجانية + play CTA; rest = primary bar +
    خاص بالمشتركين chip + chevron), number tile `NN`, title, badges (تم
    المشاهدة/قيد المعالجة/فشل), meta chips (duration / اختبار مرفق / ملف / واجب) · right
    rail keeps sticky EnrollmentCard (lg only).
- `tsc` + student-login screenshots mobile + desktop → commit.

### M7 — Review + verify + docs
- `node node_modules/typescript/bin/tsc --noEmit` clean.
- Playwright: login admin → `/admin`, `/admin/students`, `/admin/courses`, `/admin/grading`
  at 390×844 (fixed top bar, fixed bottom nav, no horizontal scroll, sections present);
  desktop 1440×900 regression (sidebar visible, bottom nav hidden); student `/course/8`
  mobile + desktop.
- Update `plans/frontend-handoff.md` §99.6 (mobile rules) → final commit.

## Out of scope / will not touch
- `app/course/[id]/subscribe/page.tsx`, `app/course/[id]/video/[video]/page.tsx` (user WIP).
- `next.config.js`, `services/bunnyVideoService.ts`, junk files, `dark:`/`.admin-console`.
- Backend (no API changes; all endpoints exist).
- Enrollments (`/admin/enrollments`) and quizzes (`/admin/quizzes`, `/admin/quizzes/:id/...`)
  pages keep current (responsive) behavior — they are not in the delivered frame set.