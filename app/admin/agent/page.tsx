'use client';

import { AgentChat } from '@/components/admin/AgentChat';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

/**
 * Ported from the design's src/routes/admin.agent.tsx — structure, Tailwind
 * classes and Arabic copy are copied verbatim. Only two things differ, both
 * forced by porting TanStack Router -> Next.js App Router:
 *   1. The root element is a <div>, not a <main>: app/admin/layout.tsx already
 *      renders the <main>, and nesting two <main>s is invalid HTML.
 *   2. The root height subtracts the shell's own mobile chrome (see below).
 *      `lg:h-dvh` is the design's own class, kept as-is.
 */
const capabilities = [
  { title: 'إدارة الطلاب', detail: 'إضافة، تعديل، أو البحث عن أي طالب بجملة واحدة.' },
  { title: 'المحتوى والفيديوهات', detail: 'رفع فيديو جديد أو ربطه باختبار مباشرة.' },
  { title: 'الاختبارات والتصحيح', detail: 'إنشاء اختبارات، منح استثناءات، ومتابعة صندوق التصحيح.' },
  { title: 'التقارير والأداء', detail: 'ملخصات فورية عن النمو، النجاح، والاشتراكات.' },
];

export default function AdminAgentPage() {
  return (
    <>
      <PageTitle title={adminTitle('المساعد الإداري')} />
      {/*
        Height: the design's root is `h-[calc(100dvh-0px)] lg:h-dvh`, which works
        there because its admin shell has NO mobile chrome. Our existing shell
        does: AdminMobileHeader is fixed h-16 and the shell column carries
        `pt-16`, while AdminMobileNav is fixed and <main> carries `pb-24`.
        A raw 100dvh would push the chat composer under the bottom nav, so the
        mobile height is 100dvh - (4rem + 6rem). `lg:h-dvh` stays verbatim: on
        lg the only chrome is the sticky h-screen sidebar column.
      */}
      <div className="flex h-[calc(100dvh-10rem)] flex-col lg:h-dvh">
        <div className="border-b border-brand-border bg-gradient-to-l from-brand-primary/10 via-brand-surface to-brand-surface px-6 py-6 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">المساعد الإداري</p>
          <h1 className="mt-1 text-2xl font-extrabold text-brand-text">تحكّم في المنصة بالكلام العادي</h1>
          <p className="mt-1.5 max-w-xl text-sm text-brand-muted">
            مش لازم تدور في القوائم — قوله اللي محتاجه وهو يتصرف أو يوجّهك بالظبط لمكانه.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_1fr]">
          <aside className="hidden overflow-y-auto border-e border-brand-border bg-brand-bg/40 p-5 lg:block">
            <p className="mb-3 text-xs font-bold text-brand-muted">قدرات المساعد</p>
            <div className="space-y-3">
              {capabilities.map((c) => (
                <div key={c.title} className="rounded-xl border-s-2 border-s-brand-primary/40 bg-brand-surface px-4 py-3">
                  <p className="text-sm font-bold text-brand-text">{c.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-brand-muted">{c.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-brand-primary/5 px-4 py-3.5">
              <p className="text-xs font-bold text-brand-primary">تلميح</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                {/* Copy is the design's verbatim; the two quotes are written as
                    &quot; only because ESLint's react/no-unescaped-entities rejects
                    raw " in JSX text. Renders identically. */}
                اكتب طلبك زي ما بتتكلم عادي — مش محتاج صياغة تقنية. مثال: &quot;عايز أعرف كام طالب اشترك النهاردة؟&quot;
              </p>
            </div>
          </aside>

          <div className="min-h-0 min-w-0">
            <AgentChat />
          </div>
        </div>
      </div>
    </>
  );
}
