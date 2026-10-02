'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Clock, Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { AgentConversation } from '@/types/agent';

interface AgentConversationsBarProps {
  conversations: AgentConversation[];
  activeId: number | null;
  loading: boolean;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const capabilities = [
  { title: 'إدارة الطلاب', detail: 'إضافة، تعديل، أو البحث عن أي طالب بجملة واحدة.' },
  { title: 'المحتوى والفيديوهات', detail: 'رفع فيديو جديد أو ربطه باختبار مباشرة.' },
  { title: 'الاختبارات والتصحيح', detail: 'إنشاء اختبارات، منح استثناءات، ومتابعة صندوق التصحيح.' },
  { title: 'التقارير والأداء', detail: 'ملخصات فورية عن النمو، النجاح، والاشتراكات.' },
];

function formatRelativeTimeAr(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const time = date.getTime();
  if (Number.isNaN(time)) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - time) / 1000);
  if (diffSec < 60) return 'الآن';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `منذ ${diffHour} ساعة`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

export function AgentConversationsBar({
  conversations,
  activeId,
  loading,
  onSelectConversation,
  onNewConversation,
  isOpenMobile = false,
  onCloseMobile,
}: AgentConversationsBarProps) {
  const [showCapabilities, setShowCapabilities] = useState(false);

  const content = (
    <div className="flex h-full flex-col bg-brand-surface">
      {/* Header & New Chat button */}
      <div className="border-b border-brand-border p-4">
        <div className="flex items-center justify-between gap-2 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-primary/10 text-brand-primary">
              <MessageSquare className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-extrabold text-brand-text">المحادثات</h2>
            {conversations.length > 0 && (
              <span className="rounded-full bg-brand-chip px-2 py-0.5 text-[11px] font-semibold text-brand-muted-strong">
                {conversations.length}
              </span>
            )}
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="grid h-7 w-7 place-items-center rounded-lg text-brand-muted hover:bg-brand-chip lg:hidden"
              aria-label="إغلاق القائمة"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={onNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary/90 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:brightness-105 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          <span>محادثة جديدة</span>
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {loading && conversations.length === 0 ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-brand-chip p-3">
                <div className="h-3 w-3/4 rounded bg-brand-border" />
                <div className="mt-2 h-2 w-1/3 rounded bg-brand-border" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-brand-chip text-brand-muted">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-brand-text">لا توجد محادثات سابقة</p>
            <p className="mt-1 text-[11px] text-brand-muted">ابدأ محادثة جديدة مع المساعد الإداري.</p>
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeId;
            const displayTitle = c.title && c.title.trim() ? c.title : `محادثة #${c.id}`;
            const timeLabel = formatRelativeTimeAr(c.lastMessageAt || c.updatedAt);

            return (
              <button
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={
                  'group flex w-full flex-col rounded-xl px-3.5 py-2.5 text-start transition ' +
                  (isActive
                    ? 'border-s-2 border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'text-brand-text hover:bg-brand-chip/80')
                }
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold leading-snug">
                    {displayTitle}
                  </span>
                  {timeLabel && (
                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-brand-muted">
                      <Clock className="h-2.5 w-2.5" />
                      {timeLabel}
                    </span>
                  )}
                </div>
                {c.messageCount > 0 && (
                  <span className="mt-1 text-[10px] text-brand-muted">
                    {c.messageCount} {c.messageCount === 1 ? 'رسالة' : 'رسائل'}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Capabilities collapsible info */}
      <div className="border-t border-brand-border bg-brand-bg/40 p-3">
        <button
          onClick={() => setShowCapabilities((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-bold text-brand-muted-strong hover:bg-brand-chip"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
            قدرات المساعد الإداري
          </span>
          {showCapabilities ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        {showCapabilities && (
          <div className="mt-2 space-y-2 text-start">
            {capabilities.map((c) => (
              <div key={c.title} className="rounded-lg border-s-2 border-brand-primary/40 bg-brand-surface p-2.5">
                <p className="text-[11px] font-bold text-brand-text">{c.title}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-brand-muted">{c.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-72 shrink-0 border-e border-brand-border lg:block">
        {content}
      </aside>

      {/* Mobile Drawer (Sheet) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
