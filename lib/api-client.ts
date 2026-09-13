/**
 * Central HTTP Client — lib/api-client.ts
 *
 * Responsibilities:
 *  - Sends `credentials: 'include'` on all requests for HttpOnly cookie management
 *  - Automatically handles 401 Unauthorized by attempting a silent token refresh (/auth/refresh-token or /auth/refresh)
 *  - Formats network failures (TypeError: Failed to fetch) into readable Arabic error messages
 *  - Standardizes parsing for `{ success: boolean, data: any, message?: string, error?: string }`
 *
 * Auth model:
 *  - HttpOnly cookies are the ONLY auth mechanism. Tokens are never returned in
 *    response bodies and never stored in JS-accessible storage (localStorage /
 *    in-memory Bearer). The in-memory Bearer store once kept as a compat shim was
 *    removed in the auth-unification round — requests authenticate purely via cookies.
 */
import {
  ApiError,
  AuthError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
} from './errors';
import { purgeLegacyAuthStorage } from '@/utils/auth-storage';
import { clearUserCache } from '@/lib/user-cache';
import { clearUserEntries } from '@/lib/data-cache';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export { API_BASE_URL };

// ---------------------------------------------------------------------------
// Request builder with Credentials & Silent Refresh Interceptor
// ---------------------------------------------------------------------------
interface RequestOptions {
  signal?: AbortSignal;
  _isRetry?: boolean;
  /** Return the raw `{ success, data, meta, ... }` body instead of unwrapping `data` */
  full?: boolean;
  /** Send a FormData body (multipart) instead of JSON. Skips the JSON Content-Type. */
  formData?: FormData;
}

function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Attempts silent token refresh when receiving a 401 status.
 *
 * Single-flighted: concurrent 401s (parallel requests after expiry, or several
 * tabs) all await the SAME in-flight refresh promise instead of firing their own
 * POST /auth/refresh-token. This matters because the backend ROTATES the
 * refresh token on every call — two racing refreshes both submit the pre-rotation
 * cookie value, and the loser's token would be flagged as a replay and revoke
 * the entire refresh-token family (logout on every device).
 */
let _pendingRefresh: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  // Single endpoint: the legacy '/auth/refresh' fallback was an unmounted
  // path (always 404) — every cycle paid a wasted request for it.
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
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
    // Fail below
  }

  return false;
}

async function attemptSilentRefresh(): Promise<boolean> {
  // Never spend refresh budget while logged out: without the login flag there
  // is no session worth refreshing (our code always sets/clears it alongside
  // the httpOnly cookies). SSR has no cookies to read — attempt (safe default).
  if (
    typeof document !== 'undefined' &&
    !document.cookie
      .split(';')
      .some((c) => c.trim() === 'isLoggedIn=true')
  ) {
    return false;
  }

  if (_pendingRefresh) return _pendingRefresh;

  _pendingRefresh = doRefresh().finally(() => {
    _pendingRefresh = null;
  });

  return _pendingRefresh;
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
  const { signal, _isRetry = false, full = false, formData } = options;
  const url = `${API_BASE_URL}${path}`;

  const headers = buildHeaders();
  if (formData) {
    // FormData sets its own multipart Content-Type with boundary; drop the JSON default.
    delete headers['Content-Type'];
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      credentials: 'include', // ⚠️ MANDATORY: Enables HttpOnly Cookie transmission
      signal,
      // API responses must never be heuristically cached: a 304 (Not Modified)
      // has no body and would break polling flows (e.g. grading-status refetch).
      cache: 'no-store',
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
    // Auth-endpoint 401s are credential errors (wrong password, unknown email),
    // never an expired session — refreshing against them only burns the shared
    // auth-limiter budget (each failure cost login + refresh).
    const isAuthPath = path.startsWith('/auth/');
    if (!isRefreshPath && !isAuthPath && !_isRetry) {
      const refreshed = await attemptSilentRefresh();
      if (refreshed) {
        // Retry original request once
        return request<T>(method, path, body, { ...options, _isRetry: true });
      }
    }

    // Final 401 — parse body for any extra context, then throw
    const errBody = await safeParseJson(response);
    purgeLegacyAuthStorage();
    clearUserCache();
    clearUserEntries();
    if (typeof window !== 'undefined') {
      document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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

  // Full response mode: return the parsed body as-is (keeps `meta` for pagination)
  if (full) {
    return resBody as T;
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

  /** POST with a FormData (multipart) body — used for binary/video uploads. */
  postFormData<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, undefined, { ...options, formData });
  },

  /** Like `get` but returns the whole `{ success, data, meta }` payload. */
  getFull<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, { ...options, full: true });
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
