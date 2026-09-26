/**
 * Agent Service — services/agentService.ts
 *
 * The REST half of the AI Admin Agent, used as the FALLBACK for the two reads the
 * chat needs before/without a live socket: the conversation list and a
 * conversation's transcript. Live turns, decisions and progress go over the
 * `/agent-ws` socket (see hooks/useAgentSocket.ts) — this file deliberately does
 * NOT wrap `POST /admin/agent/ask`, because a REST turn cannot report progress and
 * duplicating it here would invite the UI to use the slower path by accident.
 *
 *   GET /admin/agent/conversations            → AgentConversation[]
 *   GET /admin/agent/conversations/:id/messages → AgentMessage[]
 *
 * Both are admin-only (authenticateToken + authorizeAdmin) and both answer
 * `{ success: true, data }`, which api-client unwraps for us.
 */

import { apiClient } from '@/lib/api-client';
import type { AgentConversation, AgentMessage } from '@/types/agent';

/** Backend default; the route clamps whatever we send to 1..50. */
const CONVERSATIONS_TAKE = 30;

function toQuery(take: number): string {
  return take === CONVERSATIONS_TAKE ? '' : `?take=${encodeURIComponent(String(take))}`;
}

/**
 * The admin's most recent conversations, newest first. Mirrors the socket's
 * `agent:conversations` event, so the sidebar renders identically whether it was
 * filled live or from this fallback.
 */
export async function listAgentConversations(
  take: number = CONVERSATIONS_TAKE,
): Promise<AgentConversation[]> {
  return apiClient.get<AgentConversation[]>(`/admin/agent/conversations${toQuery(take)}`);
}

/**
 * One conversation's transcript. Mirrors the socket's `agent:history` event.
 *
 * A conversation that is missing OR belongs to another admin is answered 404
 * `AGENT_CONVERSATION_NOT_FOUND` on purpose — the two cases are indistinguishable
 * to the client by design — and api-client surfaces that as a `NotFoundError`.
 */
export async function getAgentMessages(conversationId: number): Promise<AgentMessage[]> {
  return apiClient.get<AgentMessage[]>(`/admin/agent/conversations/${conversationId}/messages`);
}
