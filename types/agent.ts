/**
 * AI Admin Agent — wire + domain types.
 *
 * Every shape here mirrors the backend verbatim and was read from the source of
 * truth, not from the header comment:
 *   - `src/services/agent/socketHandler.js`  (the `/agent-ws` socket surface)
 *   - `src/routes/agentRoutes.js`             (the `/admin/agent` REST surface)
 *   - `src/services/agent/agentService.js`    (`answerQuestion` → `agent:complete`)
 *   - `src/services/agent/conversationService.js` (conversation + message rows)
 *
 * TWO RULES THAT SHAPE EVERY UI THAT TOUCHES THIS FILE:
 *
 * 1. ANSWER CONTENT IS NEVER STREAMED. There is no token/`agent:token` event, by
 *    design: the grounding guard can only validate a COMPLETE answer, so a token
 *    shown before validation would defeat the check. Progress is live; the answer
 *    arrives once, validated, inside `AgentTurnResult` — or not at all.
 *
 * 2. TOOL PAYLOADS ARE NEVER SENT TO THE BROWSER. `AgentToolResultEvent` carries
 *    only a tool name and an `ok` flag; raw payloads would duplicate the server's
 *    redaction surface into the client.
 *
 * AUTH IS COOKIE-ONLY. The handshake reads the `accessToken` HttpOnly cookie and
 * re-checks the admin in the database; there is deliberately no `Authorization:
 * Bearer` fallback, so the transport must send credentials, never a token.
 */

// ---------------------------------------------------------------------------
// Progress events
// ---------------------------------------------------------------------------

/** Which answering tier produced (or is producing) the turn. */
export type AgentTier = 'deterministic' | 'llm';

/** The `source` of a successful turn — the same two tiers. */
export type AgentSource = 'deterministic' | 'llm';

export interface AgentThinkingEvent {
  type: 'thinking';
  status: string;
}

export interface AgentTierEvent {
  type: 'tier';
  tier: AgentTier;
  /** Deterministic tier only: the matched catalogue intent. */
  intent?: string | null;
  /** LLM tier only: why the deterministic fast path declined. */
  declinedReason?: string | null;
}

/**
 * ⚠ The backend emits NO `agent:tier` event. `socketHandler.js` forwards BOTH the
 * `thinking` and the `tier` progress objects through the `agent:thinking` event
 * (`if (event.type === 'thinking' || event.type === 'tier') forwardProgress('agent:thinking')(event)`),
 * so a client must listen to `agent:thinking` and switch on `type`. The
 * `agent:tier` name appears only in the file's header comment, which is wrong.
 */
export type AgentProgressEvent = AgentThinkingEvent | AgentTierEvent;

/** The MODEL's own requested call — not a tool payload. */
export interface AgentToolCallEvent {
  type: 'tool_call';
  name: string;
  args?: Record<string, unknown> | null;
}

/** Outcome flag only — never the tool's return value (see rule 2 above). */
export interface AgentToolResultEvent {
  type: 'tool_result';
  name: string | null;
  ok: boolean;
}

// ---------------------------------------------------------------------------
// Turn result (`agent:complete`)
// ---------------------------------------------------------------------------

/** A refused mutation the admin can approve or reject. */
export interface AgentApprovalRequested {
  approvalId: number;
  toolName: string;
  expiresAt: string;
}

export interface AgentDeterministicDetail {
  intent: string | null;
  tool: string | null;
  latencyMs: number;
  declinedReason: null;
}

export interface AgentLlmDetail {
  provider: string;
  toolCalls: string[];
  stopReason: string | null;
  /** The approval this turn actually spent, if any. */
  approval: number | null;
  /** A NEW pending approval the model needs a human to decide. */
  approvalRequested: AgentApprovalRequested | null;
  latencyMs: number;
}

export type AgentTurnDetail = AgentDeterministicDetail | AgentLlmDetail;

/**
 * Documented outcomes of `answerQuestion` that are NOT transport errors — they
 * ride `ok: false` on a normally-delivered `agent:complete` (or a 200 REST body).
 */
export type AgentTurnCode =
  | 'AGENT_DISABLED'
  | 'EMPTY_QUESTION'
  | 'LLM_NOT_CONFIGURED'
  | 'LLM_UNAVAILABLE'
  | 'LLM_ERROR'
  | 'TOOL_BUDGET_EXHAUSTED'
  | 'EMPTY_ANSWER'
  | 'GROUNDING_FAILED';

export interface AgentTurnSuccess {
  ok: true;
  source: AgentSource;
  answer: string;
  /**
   * ⚠ CAN BE NULL. A brand-new conversation has no id until its first turn is
   * persisted, and the `AGENT_DISABLED` / `EMPTY_QUESTION` short-circuits return
   * before any row exists at all. A null here means "start a fresh conversation" —
   * the UI must not treat it as an error.
   */
  conversationId: number | null;
  detail: AgentTurnDetail;
}

export interface AgentTurnFailure {
  ok: false;
  code: AgentTurnCode;
  /** Arabic, from the backend. Show it as-is; do not re-translate. */
  message: string;
  /** Absent (not merely null) on the short-circuits that never reach a turn. */
  conversationId?: number | null;
  declinedReason?: string | null;
  /** Only on `GROUNDING_FAILED`: the figures that failed to trace to a tool. */
  ungrounded?: string[];
}

export type AgentTurnResult = AgentTurnSuccess | AgentTurnFailure;

// ---------------------------------------------------------------------------
// Errors (`agent:error`)
// ---------------------------------------------------------------------------

/**
 * Every code `socketHandler.js` can put on an `agent:error`. Expected agent
 * failures are NOT here: those arrive as `AgentTurnFailure` on `agent:complete`.
 *
 * Note there is no PII code: `pii.js` is an egress redaction filter that masks
 * emails inside tool payloads before they ever leave the server, so it can never
 * reject a turn. `GROUNDING_FAILED` is likewise a turn code, not a socket error.
 */
export type AgentSocketErrorCode =
  | 'EMPTY_QUESTION'
  | 'INVALID_CONVERSATION'
  | 'INVALID_DECISION'
  | 'APPROVAL_EXPIRED'
  | 'APPROVAL_NOT_FOUND'
  | 'APPROVAL_ALREADY_DECIDED'
  | 'DECISION_FAILED'
  | 'CONVERSATION_NOT_FOUND'
  | 'HISTORY_FAILED'
  | 'AGENT_ERROR'
  | 'HANDLER_FAILED'
  // From services/agent/limits.js — the per-admin turn budget both surfaces share.
  | 'RATE_LIMITED'
  | 'DAILY_BUDGET_EXCEEDED';

export interface AgentSocketError {
  code: AgentSocketErrorCode;
  /** English, developer-facing. Not for display. */
  detail: string;
  /** Only on the two limiter rejections; how long until a retry may succeed. */
  retryAfterMs?: number | null;
}

// ---------------------------------------------------------------------------
// Conversations, transcript, approvals
// ---------------------------------------------------------------------------

export interface AgentConversation {
  id: number;
  /** Null for a conversation whose title could not be derived. */
  title: string | null;
  updatedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
}

export type AgentMessageRole = 'USER' | 'ASSISTANT' | 'TOOL_CALL' | 'TOOL_RESULT' | 'ERROR';

export interface AgentMessage {
  id: number;
  role: AgentMessageRole;
  /** Null for the tool roles, whose meaning is carried by `toolName`. */
  content: string | null;
  toolName: string | null;
  createdAt: string;
}

export interface AgentConversationsEvent {
  conversations: AgentConversation[];
}

export interface AgentHistoryEvent {
  conversationId: number;
  messages: AgentMessage[];
}

/** Only ever `APPROVED` or `REJECTED` — a decision, not a row status. */
export type AgentDecisionStatus = 'APPROVED' | 'REJECTED';

export interface AgentDecisionEvent {
  approvalId: number;
  status: AgentDecisionStatus;
  decidedBy: number;
  decidedAt: string;
}

// ---------------------------------------------------------------------------
// Client → server payloads
// ---------------------------------------------------------------------------

export interface AgentMessageInput {
  question: string;
  /** Omit or pass null to start a fresh conversation. */
  conversationId?: number | null;
  /** Spend a previously granted approval on this turn, exactly once. */
  approvalId?: number | null;
}

export interface AgentHistoryInput {
  conversationId: number;
}

export interface AgentDecideInput {
  approvalId: number;
  approved: boolean;
}

/** The backend's hard limit on `question`; the same number it validates against. */
export const AGENT_QUESTION_MAX_LENGTH = 2000;

/** Handshake rejections — `next(new Error(...))` before any listener is attached. */
export type AgentConnectErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_TOKEN'
  | 'ADMIN_REQUIRED'
  | 'AUTH_FAILED';

/** Lifecycle of the transport, as the socket hook reports it to the UI. */
export type AgentConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
