/**
 * Central HTTP Client — lib/api-client.ts
 *
 * Responsibilities:
 *  - Sends `credentials: 'include'` on all requests for HttpOnly cookie management
 *  - Attaches in-memory Authorization Bearer header (if present) for backward compatibility
 *  - Automatically handles 401 Unauthorized by attempting a silent token refresh (/auth/refresh-token or /auth/refresh)
 *  - Formats network failures (TypeError: Failed to fetch) into readable Arabic error messages
 *  - Standardizes parsing for `{ success: boolean, data: any, message?: string, error?: string }`
 *
 * Phase 1b changes:
 *  - Parse JSON body BEFORE branching on 403/404/409 so callers can read structured error payloads
 *    (e.g., quiz gate 403s carry quizId, yourScore, requiredScore in their body)
 *  - Added explicit 409 branch (ConflictError) for "attempt already graded" responses
 *  - 401 silent-refresh flow unchanged; only the final thrown AuthError now also carries body
 *
 * Phase 1c (cookie-only auth):
 *  - Tokens are NEVER returned in response bodies; the server sets HttpOnly
 *    cookies. The in-memory Bearer store is kept as a compatibility shim but is
 *    no longer populated by login/refresh flows — requests authenticate via cookies. */

import {
  ApiError,
  AuthError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
} from './errors';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export { API_BASE_URL };

// ---------------------------------------------------------------------------
// In-memory token store (module-level singleton)
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ---------------------------------------------------------------------------
// Request builder with Credentials & Silent Refresh Interceptor
// ---------------------------------------------------------------------------
interface RequestOptions {
  /** Set to false for public endpoints that don't need a Bearer token */
  authenticated?: boolean;
  signal?: AbortSignal;
  _isRetry?: boolean;
}

function buildHeaders(authenticated = true): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authenticated && _accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  return headers;
}

/**
 * Attempts silent token refresh when receiving a 401 status.
 */
async function attemptSilentRefresh(): Promise<boolean> {
  const refreshEndpoints = ['/auth/refresh-token', '/auth/refresh'];

  for (const endpoint of refreshEndpoints) {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        // Cookie-only auth: the refresh endpoint re-issues HttpOnly access +
        // refresh cookies. Nothing to read from the body.
        return true;
      }
    } catch {
      // Continue to next endpoint or fail
    }
  }

  return false;
}

/**
 * Safely attempt to parse a JSON response body.
 * Returns `null` if the body is empty or cannot be parsed as JSON.
 */
async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { authenticated = true, signal, _isRetry = false } = options;
  const url = `${API_BASE_URL}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(authenticated),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include', // ⚠️ MANDATORY: Enables HttpOnly Cookie transmission
      signal,
    });
  } catch (_netErr: unknown) {
    // Friendly error for CORS failures, server down, or offline status
    throw new ApiError(
      'تعذر الاتصال بالخادم، يرجى التأكد من تشغيل الخادم والتأكد من الاتصال بالشبكة.',
      0,
    );
  }

  // Handle 429 Too Many Requests (no body needed)
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : null;
    const waitMsg =
      retryAfterSeconds != null
        ? ` حاول مرة أخرى بعد ${retryAfterSeconds} ثانية.`
        : ' حاول مرة أخرى لاحقاً.';
    throw new RateLimitError(
      `لقد تجاوزت عدد الطلبات المسموح بها.${waitMsg}`,
      retryAfterSeconds,
    );
  }

  // Handle 401 Unauthorized (Silent Token Refresh Interceptor)
  // NOTE: We do NOT parse body here before the refresh attempt — if the silent
  // refresh succeeds we never need the error body. Only parse after final failure.
  if (response.status === 401) {
    const isRefreshPath = path.includes('/auth/refresh');
    if (!isRefreshPath && !_isRetry) {
      const refreshed = await attemptSilentRefresh();
      if (refreshed) {
        // Retry original request once
        return request<T>(method, path, body, { ...options, _isRetry: true });
      }
    }

    // Final 401 — parse body for any extra context, then throw
    const errBody = await safeParseJson(response);
    clearAccessToken();
    if (typeof window !== 'undefined') {
      document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('isLoggedIn');
      // Redirect to login if unauthenticated on protected action
      if (!isRefreshPath && !path.includes('/auth/login')) {
        window.location.replace('/login');
      }
    }
    throw new AuthError(undefined, errBody);
  }

  // For 403/404/409 — parse JSON body FIRST so callers can read structured payloads
  // (e.g., quiz gate 403: { message, quizId, yourScore, requiredScore })
  if (response.status === 403) {
    const errBody = await safeParseJson(response);
    const errObj = errBody as { message?: string; error?: string } | null;
    const errMsg = errObj?.message || errObj?.error || 'ليس لديك صلاحية للوصول إلى هذا المورد.';
    throw new ForbiddenError(errMsg, errBody);
  }

  if (response.status === 404) {
    const errBody = await safeParseJson(response);
    const errObj = errBody as { message?: string; error?: string } | null;
    const errMsg = errObj?.message || errObj?.error || 'لم يتم العثور على المورد المطلوب.';
    throw new NotFoundError(errMsg, errBody);
  }

  if (response.status === 409) {
    const errBody = await safeParseJson(response);
    const errObj = errBody as { message?: string; error?: string } | null;
    const errMsg = errObj?.error || errObj?.message || 'تعارض في العملية.';
    throw new ConflictError(errMsg, errBody);
  }

  // Parse JSON response body for all other statuses
  let resBody: unknown;
  try {
    resBody = await response.json();
  } catch {
    throw new ApiError(
      `استجابة غير متوقعة من الخادم (status ${response.status})`,
      response.status,
    );
  }

  // Handle non-OK HTTP statuses using `{ success: false, error: "..." }` or `{ message: "..." }`
  if (!response.ok) {
    const errObj = resBody as { success?: boolean; error?: string; message?: string };
    const errMsg =
      errObj?.error || errObj?.message || `خطأ من الخادم (status ${response.status})`;
    throw new ApiError(errMsg, response.status, resBody);
  }

  // Unwrap `{ success: true, data: T }` envelope if present
  const successBody = resBody as { success?: boolean; data?: T; message?: string } & T;

  if (
    successBody !== null &&
    typeof successBody === 'object' &&
    'success' in successBody &&
    'data' in successBody
  ) {
    return successBody.data as T;
  }

  return successBody as T;
}

// ---------------------------------------------------------------------------
// Public API Surface
// ---------------------------------------------------------------------------
export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options);
  },

  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options);
  },

  put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', path, body, options);
  },

  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  },
};
