/**
 * Typed error classes for the E-LRN API client.
 *
 * Using typed errors (instead of generic `Error`) lets callers do precise
 * `instanceof` checks and avoids stringly-typed error handling.
 *
 * Phase 1 update: Added `body?: unknown` to carry the parsed response body
 * so callers can read fields like `quizId`, `yourScore`, `requiredScore`,
 * `details[]` from structured 4xx error responses.
 */

/** Base class — carries the HTTP status code + raw response body alongside the message. */
export class ApiError extends Error {
  public readonly status: number;
  public readonly body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    // Restore prototype chain (required when extending built-ins in TypeScript)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the backend returns HTTP 429.
 * `retryAfterSeconds` is populated from the `Retry-After` response header
 * when present.
 */
export class RateLimitError extends ApiError {
  public readonly retryAfterSeconds: number | null;

  constructor(message: string, retryAfterSeconds: number | null = null, body?: unknown) {
    super(message, 429, body);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the backend returns HTTP 401 and token refresh also fails. */
export class AuthError extends ApiError {
  constructor(message = 'غير مصرح بالوصول. يرجى تسجيل الدخول مرة أخرى.', body?: unknown) {
    super(message, 401, body);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the backend returns HTTP 403. */
export class ForbiddenError extends ApiError {
  constructor(message = 'ليس لديك صلاحية للوصول إلى هذا المورد.', body?: unknown) {
    super(message, 403, body);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the backend returns HTTP 404. */
export class NotFoundError extends ApiError {
  constructor(message = 'لم يتم العثور على المورد المطلوب.', body?: unknown) {
    super(message, 404, body);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the backend returns HTTP 409 (e.g. attempt already graded). */
export class ConflictError extends ApiError {
  constructor(message = 'تعارض في العملية.', body?: unknown) {
    super(message, 409, body);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
