/**
 * Typed error classes for the E-LRN API client.
 *
 * Using typed errors (instead of generic `Error`) lets callers do precise
 * `instanceof` checks and avoids stringly-typed error handling.
 */

/** Base class — carries the HTTP status code alongside the message. */
export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
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

  constructor(message: string, retryAfterSeconds: number | null = null) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the backend returns HTTP 401 and token refresh also fails. */
export class AuthError extends ApiError {
  constructor(message = 'غير مصرح بالوصول. يرجى تسجيل الدخول مرة أخرى.') {
    super(message, 401);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the backend returns HTTP 403. */
export class ForbiddenError extends ApiError {
  constructor(message = 'ليس لديك صلاحية للوصول إلى هذا المورد.') {
    super(message, 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the backend returns HTTP 404. */
export class NotFoundError extends ApiError {
  constructor(message = 'لم يتم العثور على المورد المطلوب.') {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
