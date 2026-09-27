'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

import { useAgentSocket } from '@/hooks/useAgentSocket';
import type { AgentConnectionStatus, AgentSocketError, AgentSocketErrorCode } from '@/types/agent';

/**
 * A row in the thread. Extends the design's `AgentMessage` from
 * lib/admin-agent.ts with the three states that only a real backend can produce:
 * a failed turn, a live approval request, and a resolved decision.
 */
interface ChatMessage {
  id: string;
  role: 'admin' | 'agent';
  /** Markdown for `role: 'agent'` (the backend answers in Arabic Markdown). */
  text: string;
  action?: { label: string; to: string };
  tone?: 'error';
  approval?: {
    approvalId: number;
    toolName: string;
    expiresAt: string;
    decided: 'APPROVED' | 'REJECTED' | null;
    /**
     * The user question that produced this approval, kept so approving can
     * re-send it. The backend SPENDS an approval on a subsequent turn
     * (`agent:message { approvalId }`) — it never runs the action as part of the
     * decision — so without this the grant sat APPROVED and nothing happened
     * until the admin happened to ask the same thing again.
     */
    question: string;
  };
}

/**
 * The design's `agentIntro` and `agentSuggestions`, copied VERBATIM from
 * lib/admin-agent.ts. The rest of that file was a regex "rule engine" with
 * invented numbers that claimed real side effects — it is deliberately NOT
 * ported; every answer now comes from the socket.
 */
const agentIntro: ChatMessage = {
  id: 'intro',
  role: 'agent',
  text: 'أهلًا! أنا المساعد الإداري لأكاديميا. تقدر تطلب مني أي حاجة بلغتك العادية — إضافة طالب، رفع فيديو، متابعة تصحيح، أو تقرير أداء. جرّب دلوقتي.',
};

const agentSuggestions = [
  'كام طالب جديد انضم الأسبوع ده؟',
  'اعرضلي المقالي المعلق',
  'أضف طالب جديد اسمه سارة كامل',
  'افتحلي تقرير أداء الدورات',
];

/**
 * Arabic copy for `agent:error`. `AgentSocketError.detail` is documented as
 * English and developer-facing, so it is never shown; only the code is.
 */
const SOCKET_ERROR_MESSAGES: Record<AgentSocketErrorCode, string> = {
  EMPTY_QUESTION: 'السؤال فارغ. اكتب طلبك قبل الإرسال.',
  INVALID_CONVERSATION: 'المحادثة الحالية غير صالحة، وبنبدأ محادثة جديدة.',
  INVALID_DECISION: 'قرار الاعتماد غير صالح.',
  APPROVAL_EXPIRED: 'انتهت صلاحية طلب الاعتماد. أعد المحاولة.',
  APPROVAL_NOT_FOUND: 'طلب الاعتماد غير موجود.',
  APPROVAL_ALREADY_DECIDED: 'تم اتخاذ القرار على هذا الطلب بالفعل.',
  DECISION_FAILED: 'تعذّر حفظ قرار الاعتماد.',
  CONVERSATION_NOT_FOUND: 'المحادثة غير موجودة.',
  HISTORY_FAILED: 'تعذّر تحميل سجل المحادثة.',
  AGENT_ERROR: 'حدث خطأ في المساعد. حاول مرة أخرى.',
  HANDLER_FAILED: 'تعذّر تنفيذ الطلب. حاول مرة أخرى.',
  RATE_LIMITED: 'تم تجاوز عدد الطلبات المسموح. انتظر قليلًا ثم أعد المحاولة.',
  DAILY_BUDGET_EXCEEDED: 'انتهت الحصة اليومية من طلبات المساعد. تواصل مع مدير النظام.',
};

function agentErrorMessage(error: AgentSocketError): string {
  const base = SOCKET_ERROR_MESSAGES[error.code] ?? 'تعذّر تنفيذ الطلب. حاول مرة أخرى.';
  if (error.code === 'RATE_LIMITED' && typeof error.retryAfterMs === 'number' && error.retryAfterMs > 0) {
    return `${base} (${Math.ceil(error.retryAfterMs / 1000)} ثانية)`;
  }
  return base;
}

/** Markdown elements, styled with brand-* tokens only, to match the palette. */
const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 ps-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 ps-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h1 className="mb-1 mt-3 text-sm font-extrabold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-1 mt-3 text-sm font-extrabold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 mt-2 font-bold first:mt-0">{children}</h3>,
  table: ({ children }) => (
    <table className="mb-2 w-full border-collapse overflow-hidden rounded-lg border border-brand-border text-xs last:mb-0">
      {children}
    </table>
  ),
  thead: ({ children }) => <thead className="bg-brand-chip">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-brand-border px-2 py-1.5 text-start font-bold text-brand-text">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-brand-border px-2 py-1.5 text-start text-brand-muted-strong">{children}</td>
  ),
  code: ({ children }) => (
    <code className="rounded bg-brand-chip px-1 py-0.5 text-[0.8em] text-brand-text">{children}</code>
  ),
  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-lg bg-brand-chip p-2 last:mb-0">{children}</pre>,
  // Props are spread through: dropping `href` would make every link in an
  // answer unclickable, since this override replaces react-markdown's own `a`.
  // react-markdown escapes raw HTML (no rehype-raw is used), so this is not an
  // XSS sink; `rel` is set defensively in case a `target` is ever added.
  a: ({ children, ...props }) => (
    <a {...props} className="font-bold text-brand-primary hover:underline" rel="noopener noreferrer">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-s-2 border-brand-border ps-3 text-brand-muted-strong last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-brand-border" />,
};

export interface AgentChatProps {
  compact?: boolean;
  /**
   * Mirrors the connection status upward (AgentLauncher renders the header dot
   * from it) WITHOUT opening a second socket — the chat owns the only one.
   */
  onStatusChange?: (status: AgentConnectionStatus) => void;
}

export function AgentChat({ compact = false, onStatusChange }: AgentChatProps = {}) {
  const [log, setLog] = useState<ChatMessage[]>([agentIntro]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const seqRef = useRef(0);
  /**
   * The most recent question the admin asked. An approval is granted against the
   * turn that raised it, and the backend executes it on a later turn that
   * carries the approvalId, so the auto-resend needs the original wording. Held
   * in a ref (not state) because it is read inside a socket callback that must
   * not be re-created on every keystroke.
   */
  const lastUserQuestion = useRef('');
  /**
   * Approvals already spent, so a re-render or an impatient double-click cannot
   * replay the same grant twice. The server rejects a replay anyway, but a
   * visible failure for a click the admin believes was one click is worse than
   * doing nothing.
   */
  const lastSpentApproval = useRef<number | null>(null);
  /**
   * The live thread, mirrored into a ref so the socket callbacks can read the
   * current messages without being re-created on every render (which would tear
   * down and re-handshake the socket on each keystroke).
   */
  const logRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    logRef.current = log;
  }, [log]);

  const push = useCallback((message: Omit<ChatMessage, 'id'>) => {
    seqRef.current += 1;
    setLog((prev) => [...prev, { ...message, id: `m${seqRef.current}` }]);
  }, []);

  const endTurn = useCallback(() => {
    setThinking(false);
    setProgress(null);
  }, []);

  const markDecision = useCallback((approvalId: number, decided: 'APPROVED' | 'REJECTED') => {
    setLog((prev) =>
      prev.map((m) =>
        m.approval && m.approval.approvalId === approvalId
          ? { ...m, approval: { ...m.approval, decided } }
          : m,
      ),
    );
  }, []);

  const { status, isConnected, sendMessage, submitDecision } = useAgentSocket({
    onConnectionChange: (next) => {
      onStatusChange?.(next);
      // A drop mid-turn leaves the server working with nobody listening; stop
      // the dots so the thread does not claim it is still thinking.
      if (next !== 'connected') endTurn();
    },
    onProgress: (event) => {
      if (event.type === 'thinking') setProgress(event.status || null);
    },
    onToolCall: (event) => setProgress(`جارٍ تنفيذ: ${event.name}`),
    onToolResult: (event) =>
      setProgress(event.ok ? null : `تعذّر تنفيذ: ${event.name ?? 'إجراء'}`),
    onComplete: (result) => {
      endTurn();
      if (result.ok) {
        // Documented as nullable: a brand-new conversation has no id until its
        // first turn is persisted, and null means "start a fresh one".
        setConversationId(result.conversationId);
        if (result.answer.trim()) push({ role: 'agent', text: result.answer });
        const requested = 'approvalRequested' in result.detail ? result.detail.approvalRequested : null;
        if (requested) {
          push({
            role: 'agent',
            text: 'محتاج موافقتك قبل ما أنفّذ الإجراء ده.',
            approval: {
              approvalId: requested.approvalId,
              toolName: requested.toolName,
              expiresAt: requested.expiresAt,
              decided: null,
              // Captured from the thread: the last thing the admin said is the
              // request this approval answers.
              question: lastUserQuestion.current,
            },
          });
        }
      } else {
        // `message` is Arabic from the backend — shown as-is, never re-translated.
        // `conversationId` is merely absent on the short-circuits, so only a
        // real number is allowed to move the id.
        if (typeof result.conversationId === 'number') setConversationId(result.conversationId);
        push({ role: 'agent', text: result.message, tone: 'error' });
      }
    },
    onError: (error) => {
      endTurn();
      push({ role: 'agent', text: agentErrorMessage(error), tone: 'error' });
    },
    onDecision: (payload) => {
      markDecision(payload.approvalId, payload.status);
      // The decision only RECORDS the grant; the action runs on a later turn that
      // carries the approvalId. The resend is driven here rather than in decide()
      // so it happens only once the server has confirmed APPROVED — spending a
      // grant the server rejected would fail the replay and read as a broken
      // button to the admin.
      if (payload.status === 'APPROVED') {
        const target = logRef.current.find(
          (m) => m.approval && m.approval.approvalId === payload.approvalId,
        );
        if (target?.approval) {
          // Guarded against a replay: a second `agent:decision` for the same
          // grant must not spend it twice.
          if (lastSpentApproval.current === payload.approvalId) return;
          lastSpentApproval.current = payload.approvalId;
          setThinking(false);
          send(target.approval.question, payload.approvalId);
        }
      }
    },
  });

  const pendingApproval = useMemo(
    () => log.find((m) => m.approval && m.approval.decided === null) ?? null,
    [log],
  );

  // Re-render only while an approval is on screen, so "expired" stays honest.
  useEffect(() => {
    if (!pendingApproval) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [pendingApproval]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log, thinking, progress]);

  function send(text: string, approvalId?: number) {
    const msg = text.trim();
    if (!msg || thinking) return;
    // Refused (not buffered) while offline, so nothing is echoed that never left.
    if (!sendMessage({ question: msg, conversationId, approvalId })) return;
    lastUserQuestion.current = msg;
    // The auto-resend replays the admin's own request to SPEND an approval, so it
    // is not echoed as a second bubble — the thread should read as one request.
    if (approvalId === undefined) push({ role: 'admin', text: msg });
    setInput('');
    setThinking(true);
    setProgress(null);
  }

  function decide(approvalId: number, approved: boolean) {
    if (!submitDecision(approvalId, approved)) {
      push({ role: 'agent', text: SOCKET_ERROR_MESSAGES.HANDLER_FAILED, tone: 'error' });
      return;
    }
    // NOTE: approving does NOT resend from here. The backend only RECORDS the
    // grant on `agent:decide`; the action executes on a LATER turn that carries
    // the approvalId. The resend therefore lives in `onDecision`, so it can only
    // fire after the server has actually confirmed APPROVED — spending a grant
    // the server might still reject would surface as a broken button.
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
        {log.map((m) => (
          <div key={m.id} className={"flex " + (m.role === 'admin' ? 'justify-end' : 'justify-start')}>
            {m.role === 'agent' && (
              <span className="me-2 grid h-7 w-7 shrink-0 place-items-center self-end rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-[10px] font-bold text-white">
                AI
              </span>
            )}
            <div
              className={
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ' +
                (m.role === 'admin'
                  ? 'rounded-ee-sm bg-brand-primary text-white'
                  : m.tone === 'error'
                    ? 'rounded-es-sm border border-brand-accent/40 bg-brand-accent/10 text-brand-text'
                    : 'rounded-es-sm border border-brand-border bg-brand-surface text-brand-text')
              }
            >
              {m.role === 'agent' ? (
                <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                  {m.text}
                </Markdown>
              ) : (
                m.text
              )}
              {m.action && (
                <Link
                  href={m.action.to}
                  className={
                    'mt-2 flex items-center gap-1 text-xs font-bold ' +
                    (m.role === 'admin' ? 'text-white/90 hover:text-white' : 'text-brand-primary hover:underline')
                  }
                >
                  {m.action.label}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              )}
              {m.approval && <ApprovalPrompt approval={m.approval} now={now} onDecide={decide} />}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <span className="me-2 grid h-7 w-7 shrink-0 place-items-center self-end rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-[10px] font-bold text-white">
              AI
            </span>
            <div>
              {progress && <p className="mb-1 text-[11px] text-brand-muted-strong">{progress}</p>}
              <div className="flex items-center gap-1 rounded-2xl rounded-es-sm border border-brand-border bg-brand-surface px-4 py-3">
                <span className="agent-dot h-1.5 w-1.5 rounded-full bg-brand-muted" />
                <span className="agent-dot h-1.5 w-1.5 rounded-full bg-brand-muted [animation-delay:0.15s]" />
                <span className="agent-dot h-1.5 w-1.5 rounded-full bg-brand-muted [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {status !== 'connected' && (
        <div className="border-t border-brand-border bg-brand-chip px-4 py-2 text-center text-[11px] text-brand-muted-strong sm:px-5">
          {status === 'connecting'
            ? 'جارٍ الاتصال بالمساعد…'
            : status === 'error'
              ? 'تعذّر الاتصال بالمساعد. تأكد من اتصالك بالإنترنت.'
              : 'المساعد غير متصل حاليًا، سيتم إعادة الاتصال تلقائيًا.'}
        </div>
      )}

      {log.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2 sm:px-5">
          {agentSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-muted-strong transition hover:border-brand-primary/50 hover:text-brand-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-brand-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب طلبك للمساعد الإداري…"
          disabled={!isConnected}
          className="w-full rounded-full border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="إرسال"
          disabled={!isConnected}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-primary text-white transition hover:bg-brand-primary/90 disabled:opacity-60"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="-scale-x-100"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </form>
    </div>
  );
}

/**
 * The HITL block the design never had: a real pending approval from
 * `AgentLlmDetail.approvalRequested`, decided over `agent:decide`. The two
 * buttons reuse the design's own chip and send-button shapes so they read as
 * part of the same component.
 */
function ApprovalPrompt({
  approval,
  now,
  onDecide,
}: {
  approval: NonNullable<ChatMessage['approval']>;
  now: number;
  onDecide: (approvalId: number, approved: boolean) => void;
}) {
  const { approvalId, toolName, expiresAt, decided } = approval;
  if (decided) {
    return (
      <p className="mt-2 text-xs font-bold text-brand-muted-strong">
        {decided === 'APPROVED' ? 'تمت الموافقة على الإجراء.' : 'تم رفض الإجراء.'}
      </p>
    );
  }
  // The server re-checks this and answers APPROVAL_EXPIRED; disabling here just
  // stops the admin burning a click on a request that can no longer land.
  const expired = Number.isNaN(Date.parse(expiresAt)) ? false : now >= Date.parse(expiresAt);
  if (expired) {
    return (
      <p className="mt-2 text-xs font-bold text-brand-accent">
        انتهت صلاحية طلب الاعتماد. أعد المحاولة.
      </p>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        onClick={() => onDecide(approvalId, true)}
        className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-primary/90"
      >
        موافقة
      </button>
      <button
        onClick={() => onDecide(approvalId, false)}
        className="rounded-full border border-brand-border px-3 py-1.5 text-xs font-bold text-brand-muted-strong transition hover:border-brand-primary/50 hover:text-brand-primary"
      >
        رفض
      </button>
      <span className="text-[11px] text-brand-muted">الإجراء: {toolName}</span>
    </div>
  );
}
