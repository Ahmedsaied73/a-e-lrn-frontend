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

        <div className="min-h-0 flex-1 overflow-hidden">
          <AgentChat />
        </div>
      </div>
    </>
  );
}
