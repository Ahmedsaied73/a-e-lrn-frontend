/**
 * Payment Service — services/paymentService.ts
 *
 * Typed wrappers for the student payment surface. Backend contract
 * (whole-EGP amounts; checkout URLs are absolute Paymob hosted pages):
 *   POST /payments/checkout           { courseSlug } → CheckoutResponse
 *   GET  /payments/status/:reference  → PaymentStatusResponse (owner-checked)
 *   GET  /payments/history            → PaymentHistoryEntry[]
 *
 * Uses apiClient (credentials: include, silent refresh, envelope unwrapping) —
 * never raw fetch, matching services/courseService.ts conventions.
 */

import { apiClient } from '@/lib/api-client';
import { cached, userKey } from '@/lib/data-cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Terminal + non-terminal payment states mirrored from the backend enum. */
export type PaymentStatusState = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

export interface CheckoutResponse {
  paymentId: number;
  /** Our correlation id — poll GET /payments/status/:providerReference with it. */
  providerReference: string;
  /** Whole EGP (never piasters). */
  amountMajor: number;
  currency: string;
  /** Absolute Paymob hosted-checkout URL — navigate with window.location.assign. */
  checkoutUrl: string;
  /** Hosted-session expiry — after this the checkout must be restarted. */
  expiresAt: string;
  /** true = an open checkout already existed and its URL was returned again. */
  reused: boolean;
}

export interface PaymentStatusResponse {
  status: PaymentStatusState;
  /** Convenience: status === 'COMPLETED'. */
  paid: boolean;
  /** The student holds a paid, unexpired enrollment for the course. */
  enrolled: boolean;
  amountMajor: number;
  currency: string;
  paidAt: string | null;
  course: { slug: string; title: string } | null;
}

export interface PaymentHistoryEntry {
  id: number;
  status: PaymentStatusState;
  amountMajor: number;
  currency: string;
  provider: string;
  providerReference: string;
  paidAt: string | null;
  createdAt: string;
  course: { slug: string; title: string } | null;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Start (or resume) a Paymob checkout for a course.
 * Errors: 400 COURSE_IS_FREE · 404 COURSE_NOT_FOUND · 409 ALREADY_PAID ·
 * 503 PAYMENTS_DISABLED — all arrive as ApiError (`.status`, `.message`).
 *
 * NOT cached: a checkout is a mutation that must hit the server every time
 * (the backend reuses an open checkout itself — D5 — so there is no cost to
 * always asking).
 */
export async function createCheckout(courseSlug: string): Promise<CheckoutResponse> {
  return apiClient.post<CheckoutResponse>('/payments/checkout', { courseSlug });
}

/**
 * Poll one payment's status (result page). 404 = not yours or doesn't exist.
 *
 * NOT cached, deliberately: the result page polls every 3s and must observe
 * the freshest state — a stale PENDING here would delay unlocking a paid
 * course by up to the cache TTL.
 */
export async function getPaymentStatus(providerReference: string): Promise<PaymentStatusResponse> {
  return apiClient.get<PaymentStatusResponse>(
    `/payments/status/${encodeURIComponent(providerReference)}`,
  );
}

/**
 * The signed-in student's own payment history (newest first).
 *
 * Cached 30s, user-scoped — same convention as getEnrolledCourses: it backs
 * list-style views (and the result page's no-ref recovery lookup), flips are
 * rare, and the result page's live polling goes through getPaymentStatus
 * (uncached) so correctness never depends on this TTL.
 */
export async function getPaymentHistory(): Promise<PaymentHistoryEntry[]> {
  return cached(userKey('/payments/history'), 30_000, async () => {
    return apiClient.get<PaymentHistoryEntry[]>('/payments/history');
  });
}