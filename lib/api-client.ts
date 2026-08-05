/**
 * Central HTTP Client — lib/api-client.ts
 *
 * Responsibilities:
 *  - Holds the accessToken in a module-level variable (NEVER localStorage/sessionStorage)
 *  - Attaches Authorization: Bearer <token> to every authenticated request
 *  - Parses the new { success, data, error } API response envelope
 *  - Handles HTTP 429 → throws RateLimitError with retryAfterSeconds
 *  - Handles HTTP 401 → clears token, dispatches a redirect signal
 *  - Handles HTTP 403, 404 → throws typed errors
 *  - Exports a typed interface: apiClient.get / post / put / delete
 */

import {
  ApiError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
} from './errors';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

// ---------------------------------------------------------------------------
// In-memory token store (module-level singleton — invisible to XSS scripts)
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;

/** Called by authService after a successful login or token refresh. */
export function setAccessToken(token: string): void {
  _accessToken = token;
}

/** Called by authService on logout. */
export function clearAccessToken(): void {
  _accessToken = null;
}

/** Read the current in-memory token (used internally and by authService). */
export function getAccessToken(): string | null {
  return _accessToken;
}

// ---------------------------------------------------------------------------
// Response envelope parser
// ---------------------------------------------------------------------------
/**
 * Parses an API response and:
 *  - Returns `data` on success
 *  - Throws a typed error on failure
 */
async function parseResponse<T>(response: Response): Promise<T> {
  // Handle 429 before parsing body
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

  if (response.status === 401) {
    clearAccessToken();
    // Clear the non-sensitive persistence flag so middleware re-routes to /login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      // Use replace to avoid adding the current page to history
      window.location.replace('/login');
    }
    throw new AuthError();
  }

  if (response.status === 403) {
    throw new ForbiddenError();
  }

  if (response.status === 404) {
    throw new NotFoundError();
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      `استجابة غير متوقعة من الخادم (status ${response.status})`,
      response.status,
    );
  }

  // Handle remaining non-OK statuses using the { success: false, error } envelope
  if (!response.ok) {
    const errorBody = body as { success: false; error?: string };
    throw new ApiError(
      errorBody?.error ?? `خطأ من الخادم (status ${response.status})`,
      response.status,
    );
  }

  // Successful envelope: { success: true, data: T }  OR  { success: true, data: T[], meta: ... }
  const successBody = body as { success?: boolean; data?: T } & T;

  // If the backend wraps in { success, data }, unwrap it.
  // Some endpoints (auth) return flat objects without the envelope.
  if (
    successBody !== null &&
    typeof successBody === 'object' &&
    'success' in successBody &&
    'data' in successBody
  ) {
    return successBody.data as T;
  }

  // Flat response (e.g. { message, token } from /auth/login)
  return successBody as T;
}

// ---------------------------------------------------------------------------
// Request builder
// ---------------------------------------------------------------------------
interface RequestOptions {
  /** Set to false for public endpoints that don't need a Bearer token */
  authenticated?: boolean;
  signal?: AbortSignal;
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

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { authenticated = true, signal } = options;

  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: buildHeaders(authenticated),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  return parseResponse<T>(response);
}

// ---------------------------------------------------------------------------
// Public API surface
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
