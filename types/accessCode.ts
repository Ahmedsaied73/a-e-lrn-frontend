export type AccessCodeStatus = 'AVAILABLE' | 'REDEEMED' | 'REVOKED';

export interface AccessBatch {
  id: number;
  courseId: number;
  courseSlug?: string | null;
  courseName: string;
  quantity: number;
  codeLength: number;
  label?: string | null;
  tags: string[];
  stats: {
    available: number;
    redeemed: number;
    revoked: number;
  };
  generatedBy: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export interface AccessCodeItem {
  id: number;
  code: string;
  status: AccessCodeStatus;
  redeemedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
  redeemedAt?: string | null;
  revokedBy?: {
    id: number;
    name: string;
    email?: string;
  } | number | null;
  revokedAt?: string | null;
  createdAt?: string;
}

export interface GenerateBatchRequest {
  courseId: number | string;
  quantity: number;
  codeLength?: 8 | 10 | 12;
  label?: string;
  tags?: string[];
}

export interface GenerateBatchResponse {
  batchId: number;
  courseId: number;
  courseName: string;
  quantity: number;
  codeLength: number;
  label?: string | null;
  tags: string[];
  codes: string[];
  generatedAt: string;
}

export interface RedeemCodeResponse {
  courseName: string;
  courseId: number;
  courseSlug?: string | null;
  enrollmentId: number;
  expiresAt: string;
}

export interface CodeLookupResponse {
  id: number;
  code: string;
  status: AccessCodeStatus;
  courseId?: number;
  courseName: string;
  batchId: number;
  batchLabel?: string | null;
  redeemedBy?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  redeemedAt?: string | null;
  revokedBy?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  revokedAt?: string | null;
  createdAt?: string;
}

export interface BatchPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BatchListResponse {
  batches: AccessBatch[];
  pagination: BatchPaginationMeta;
  summaryStats?: {
    available: number;
    redeemed: number;
    revoked: number;
  };
}

export interface BatchDetailsResponse {
  batch: AccessBatch;
  codes: AccessCodeItem[];
  pagination: BatchPaginationMeta;
}
