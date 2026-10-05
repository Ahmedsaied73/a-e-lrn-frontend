'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AgentChat } from '@/components/admin/AgentChat';
import type { AgentConnectionStatus } from '@/types/agent';

/**
 * The design hardcoded an "online" dot. It is now bound to the socket the chat
 * owns — `AgentChat` reports upward instead of opening a second connection.
 */
const PRESENCE: Record<AgentConnectionStatus, { label: string; dot: string; text: string }> = {
  connected: { label: 'متصل الآن', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  connecting: { label: 'جارٍ الاتصال…', dot: 'bg-amber-500', text: 'text-amber-600' },
  disconnected: { label: 'غير متصل', dot: 'bg-brand-muted', text: 'text-brand-muted-strong' },
  error: { label: 'تعذّر الاتصال', dot: 'bg-brand-accent', text: 'text-brand-accent' },
};

export function AgentLauncher() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AgentConnectionStatus>('disconnected');
  const presence = PRESENCE[status];

  return (
    <>
      {open && (
        <div className="agent-panel-enter fixed bottom-24 end-4 z-50 flex h-[520px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-2xl sm:end-6">
          <div className="flex items-center justify-between gap-2 border-b border-brand-border bg-gradient-to-l from-brand-primary/10 to-transparent px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-bold text-white">
                AI
                <span className={"absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-surface " + presence.dot} />
              </span>
              <div>
                <p className="text-sm font-extrabold text-brand-text">المساعد الإداري</p>
                <p className={"text-[11px] " + presence.text}>{presence.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/admin/agent"
                onClick={() => setOpen(false)}
                aria-label="فتح الصفحة الكاملة"
                className="grid h-7 w-7 place-items-center rounded-lg text-brand-muted hover:bg-brand-hover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 4h11v11M20 4 4 20M4 15v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="grid h-7 w-7 place-items-center rounded-lg text-brand-muted hover:bg-brand-hover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <AgentChat compact onStatusChange={setStatus} />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="المساعد الإداري"
        className={
          "fixed bottom-4 end-3 z-50 flex h-12 w-12 sm:bottom-6 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-white shadow-lg transition hover:scale-105 sm:end-6 " +
          (open ? "" : "agent-fab-pulse")
        }
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 0 0-9 9c0 1.6.42 3.1 1.15 4.4L3 21l4.8-1.1A9 9 0 1 0 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="8.5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="15.5" cy="12" r="1" fill="currentColor" /></svg>
        )}
      </button>
    </>
  );
}
