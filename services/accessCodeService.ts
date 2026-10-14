/**
 * Access Code Service — services/accessCodeService.ts
 *
 * Provides typed access to the backend Access Codes subsystem (/access-codes/*):
 * - Student redemption: POST /access-codes/redeem
 * - Admin batch generation: POST /access-codes/generate
 * - Admin batch listing: GET /access-codes/batches
 * - Admin batch details: GET /access-codes/batches/:id
 * - Admin CSV export: GET /access-codes/batches/:id/download
 * - Admin batch revoke: POST /access-codes/revoke-batch
 * - Admin codes revoke: POST /access-codes/revoke
 * - Admin code lookup: GET /access-codes/lookup/:code
 */

import { apiClient } from '@/lib/api-client';
import type {
  AccessBatch,
  AccessCodeItem,
  BatchDetailsResponse,
  BatchListResponse,
  CodeLookupResponse,
  GenerateBatchRequest,
  GenerateBatchResponse,
  RedeemCodeResponse,
} from '@/types/accessCode';

/**
 * Transliterates Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) numerals to standard ASCII (0-9).
 */
export function convertArabicDigits(value: string): string {
  if (!value) return '';
  return value
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

function buildQuery(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      searchParams.set(key, String(val).trim());
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const accessCodeService = {
  /**
   * Student: Redeems an access code to unlock a course.
   */
  async redeemCode(code: string): Promise<RedeemCodeResponse> {
    const clean = convertArabicDigits(code).toUpperCase().replace(/[\s-]/g, '').trim();
    return apiClient.post<RedeemCodeResponse>('/access-codes/redeem', { code: clean });
  },

  /**
   * Admin: Generates a new batch of access codes for a specific course.
   */
  async generateBatch(payload: GenerateBatchRequest): Promise<GenerateBatchResponse> {
    return apiClient.post<GenerateBatchResponse>('/access-codes/generate', payload);
  },

  /**
   * Admin: Retrieves paginated list of code batches with filtering.
   */
  async getBatches(params?: {
    courseId?: number | string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BatchListResponse> {
    const qs = buildQuery(params);
    return apiClient.get<BatchListResponse>(`/access-codes/batches${qs}`);
  },

  /**
   * Admin: Retrieves a batch's details along with its individual codes (paginated).
   */
  async getBatchDetails(
    batchId: number,
    params?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<BatchDetailsResponse> {
    const qs = buildQuery(params);
    return apiClient.get<BatchDetailsResponse>(`/access-codes/batches/${batchId}${qs}`);
  },

  /**
   * Admin: Downloads the CSV file for a batch of access codes via apiClient.
   */
  async downloadBatchCSV(batchId: number): Promise<Blob> {
    return apiClient.getBlob(`/access-codes/batches/${batchId}/download`);
  },

  /**
   * Helper to trigger a CSV file download in the browser.
   * Defers revokeObjectURL by 1s to prevent premature blob disposal in browsers.
   */
  async triggerBatchCSVDownload(batchId: number, defaultName?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const blob = await this.downloadBatchCSV(batchId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultName || `batch-${batchId}-codes.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  },

  /**
   * Admin: Revokes all unused AVAILABLE codes in an entire batch.
   */
  async revokeBatch(batchId: number): Promise<{ revokedCount: number }> {
    return apiClient.post<{ revokedCount: number }>('/access-codes/revoke-batch', { batchId });
  },

  /**
   * Admin: Revokes specific individual codes by their IDs.
   */
  async revokeCodes(codeIds: number[]): Promise<{ revokedCount: number }> {
    return apiClient.post<{ revokedCount: number }>('/access-codes/revoke', { codeIds });
  },

  /**
   * Admin: Looks up full audit history and status for any code.
   */
  async lookupCode(code: string): Promise<CodeLookupResponse> {
    const clean = convertArabicDigits(code).toUpperCase().replace(/[\s-]/g, '').trim();
    return apiClient.get<CodeLookupResponse>(
      `/access-codes/lookup/${encodeURIComponent(clean)}`,
    );
  },
};
