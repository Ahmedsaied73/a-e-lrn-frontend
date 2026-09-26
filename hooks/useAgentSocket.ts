"use client";

/**
 * useAgentSocket — the live transport for the AI Admin Agent.
 *
 * Owns ONE socket.io connection to the backend's `/agent-ws` namespace and
 * translates its events into plain callbacks. Everything the agent does live —
 * progress, tool lifecycle, the finished turn, approvals — arrives here; the two
 * REST reads it needs as a fallback live in services/agentService.ts.
 *
 * WHY THE REF PLUMBING (the naive `useEffect(..., [])` with inline closures is a
 * known trap): if the listeners closed over props, every render would produce new
 * closures, so the connection effect would either have to re-run (tearing down and
 * re-handshaking the socket on every keystroke, dropping a turn mid-flight) or
 * the listeners would call a stale first-render callback forever. Instead the
 * socket is created ONCE and the listeners read `handlersRef.current`, which is
 * refreshed after every render. Callbacks may therefore change identity freely;
 * `sendMessage` and friends stay referentially stable.
 *
 * AUTH: cookie-only. The handshake reads the HttpOnly `accessToken` cookie and
 * re-checks the admin in the database — there is no Bearer fallback — so the
 * connection sends credentials and never a token.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api-client";
import { AGENT_QUESTION_MAX_LENGTH } from "@/types/agent";
import type {
  AgentConnectionStatus,
  AgentConversationsEvent,
  AgentDecideInput,
  AgentDecisionEvent,
  AgentHistoryEvent,
  AgentHistoryInput,
  AgentMessageInput,
  AgentProgressEvent,
  AgentSocketError,
  AgentToolCallEvent,
  AgentToolResultEvent,
  AgentTurnResult,
} from "@/types/agent";

/** `SOCKET_PATH` in the backend's socketHandler.js. */
const AGENT_SOCKET_PATH = "/agent-ws";

/** Server → client. One entry per event the backend actually emits. */
interface AgentServerEvents {
  /** Carries BOTH `{ type: 'thinking' }` and `{ type: 'tier' }` — there is no `agent:tier`. */
  "agent:thinking": (event: AgentProgressEvent) => void;
  "agent:tool_call": (event: AgentToolCallEvent) => void;
  "agent:tool_result": (event: AgentToolResultEvent) => void;
  "agent:complete": (result: AgentTurnResult) => void;
  "agent:error": (error: AgentSocketError) => void;
  "agent:conversations": (payload: AgentConversationsEvent) => void;
  "agent:history": (payload: AgentHistoryEvent) => void;
  "agent:decision": (payload: AgentDecisionEvent) => void;
}

/** Client → server. `AgentMessageInput` IS the wire payload, not a wrapper. */
interface AgentClientEvents {
  "agent:message": (payload: AgentMessageInput) => void;
  "agent:conversations": () => void;
  "agent:history": (payload: AgentHistoryInput) => void;
  "agent:decide": (payload: AgentDecideInput) => void;
}

type AgentSocket = Socket<AgentServerEvents, AgentClientEvents>;

export interface UseAgentSocketOptions {
  /** Progress, both tiers. Switch on `event.type` / `event.tier`. */
  onProgress?: (event: AgentProgressEvent) => void;
  onToolCall?: (event: AgentToolCallEvent) => void;
  onToolResult?: (event: AgentToolResultEvent) => void;
  /** The finished turn. Check `result.ok` — a refusal arrives here, not as an error. */
  onComplete?: (result: AgentTurnResult) => void;
  /** Transport/validation failures only. `retryAfterMs` rides the limiter codes. */
  onError?: (error: AgentSocketError) => void;
  onConversations?: (payload: AgentConversationsEvent) => void;
  onHistory?: (payload: AgentHistoryEvent) => void;
  onDecision?: (payload: AgentDecisionEvent) => void;
  onConnectionChange?: (status: AgentConnectionStatus) => void;
  /** Set false to hold the socket closed (e.g. the admin is logged out). */
  enabled?: boolean;
}

export interface UseAgentSocketResult {
  status: AgentConnectionStatus;
  isConnected: boolean;
  /**
   * Ask one question. Pass no `conversationId` to start a fresh conversation —
   * the id that comes back on `onComplete` may be null for a brand-new one.
   * Returns false when nothing was sent (not connected, or invalid input).
   */
  sendMessage: (input: AgentMessageInput) => boolean;
  /** Ask for the conversation list (socket equivalent of the REST fallback). */
  loadConversations: () => boolean;
  /** Ask for one conversation's transcript. */
  loadHistory: (conversationId: number) => boolean;
  /** Approve or reject a pending action. */
  submitDecision: (approvalId: number, approved: boolean) => boolean;
  /** Close the connection early; the effect reconnects if `enabled` stays true. */
  disconnect: () => void;
}

/** Mirrors the server's `toPositiveInt`: anything else is treated as absent. */
function toPositiveInt(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function useAgentSocket(options: UseAgentSocketOptions = {}): UseAgentSocketResult {
  const { enabled = true } = options;
  const [status, setStatus] = useState<AgentConnectionStatus>("disconnected");

  // The single source of truth for the live connection, and the reason the
  // effect below can register its listeners exactly once.
  const socketRef = useRef<AgentSocket | null>(null);
  // The consumer's latest callbacks. Listeners dereference this on every event,
  // so a new inline arrow on each render is free — no re-handshake, no staleness.
  const handlersRef = useRef<UseAgentSocketOptions>(options);
  // Guards state updates that would land after cleanup (the manager outlives the
  // Socket's own listeners, which removeAllListeners does not detach).
  const activeRef = useRef(false);

  useEffect(() => {
    handlersRef.current = options;
  });

  const setStatusSafe = useCallback((next: AgentConnectionStatus) => {
    if (!activeRef.current) return;
    setStatus(next);
    handlersRef.current.onConnectionChange?.(next);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    activeRef.current = true;
    setStatusSafe("connecting");

    // autoConnect:false so the lifecycle is ours — the effect owns connect and
    // cleanup, and nothing can connect a socket the effect does not know about.
    //
    // The cast carries the event maps: `io()` in socket.io-client 4.8 returns an
    // untyped `Socket<DefaultEventsMap>`, so this is where the wire contract is
    // asserted once, and every `on`/`emit` below is then checked against it.
    const socket = io(API_BASE_URL, {
      path: AGENT_SOCKET_PATH,
      withCredentials: true,
      autoConnect: false,
    }) as AgentSocket;
    socketRef.current = socket;

    socket.on("connect", () => setStatusSafe("connected"));
    socket.on("disconnect", () => setStatusSafe("disconnected"));
    socket.on("connect_error", () => setStatusSafe("error"));
    socket.io.on("reconnect_attempt", () => setStatusSafe("connecting"));

    socket.on("agent:thinking", (event) => handlersRef.current.onProgress?.(event));
    socket.on("agent:tool_call", (event) => handlersRef.current.onToolCall?.(event));
    socket.on("agent:tool_result", (event) => handlersRef.current.onToolResult?.(event));
    socket.on("agent:complete", (result) => handlersRef.current.onComplete?.(result));
    socket.on("agent:error", (error) => handlersRef.current.onError?.(error));
    socket.on("agent:conversations", (payload) => handlersRef.current.onConversations?.(payload));
    socket.on("agent:history", (payload) => handlersRef.current.onHistory?.(payload));
    socket.on("agent:decision", (payload) => handlersRef.current.onDecision?.(payload));

    socket.connect();

    return () => {
      activeRef.current = false;
      socketRef.current = null;
      // removeAllListeners BEFORE disconnect: otherwise our own 'disconnect'
      // handler fires a setState during unmount.
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [enabled, setStatusSafe]);

  /**
   * Sends are refused rather than buffered while offline. socket.io queues an
   * emit made on a closed socket and flushes it on the next connect — which would
   * silently re-ask a question minutes later, once per reconnect attempt.
   */
  const connectedSocket = useCallback((): AgentSocket | null => {
    const socket = socketRef.current;
    return socket && socket.connected ? socket : null;
  }, []);

  const sendMessage = useCallback(
    (input: AgentMessageInput): boolean => {
      const socket = connectedSocket();
      if (!socket) return false;
      const question = typeof input.question === "string" ? input.question : "";
      // The same guard the server applies; catching it here saves a round trip
      // and keeps an over-long question from being counted against the budget.
      if (!question.trim() || question.length > AGENT_QUESTION_MAX_LENGTH) return false;
      socket.emit("agent:message", {
        question,
        conversationId: toPositiveInt(input.conversationId),
        approvalId: toPositiveInt(input.approvalId),
      });
      return true;
    },
    [connectedSocket],
  );

  const loadConversations = useCallback((): boolean => {
    const socket = connectedSocket();
    if (!socket) return false;
    socket.emit("agent:conversations");
    return true;
  }, [connectedSocket]);

  const loadHistory = useCallback(
    (conversationId: number): boolean => {
      const socket = connectedSocket();
      if (!socket) return false;
      if (toPositiveInt(conversationId) === null) return false;
      socket.emit("agent:history", { conversationId });
      return true;
    },
    [connectedSocket],
  );

  const submitDecision = useCallback(
    (approvalId: number, approved: boolean): boolean => {
      const socket = connectedSocket();
      if (!socket) return false;
      if (toPositiveInt(approvalId) === null || typeof approved !== "boolean") return false;
      socket.emit("agent:decide", { approvalId, approved });
      return true;
    },
    [connectedSocket],
  );

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    status,
    isConnected: status === "connected",
    sendMessage,
    loadConversations,
    loadHistory,
    submitDecision,
    disconnect,
  };
}
