# Access Codes Frontend Integration Specification

> **Target App:** `a-e-lrn-frontend/` (Next.js App Router 13.5 RTL Arabic)  
> **Backend Integration:** `http://localhost:3005/access-codes`  
> **Feature Flag Gate:** `features.accessCodes` from `GET /user/me` and `GET /admin/dashboard`

---

## 1. Feature Overview

Access Codes allow students to enter a voucher code purchased offline from tutoring centers and immediately gain access to a course (`isPaid: true`, 365-day access window).

This frontend integration consists of two primary user journeys:
1. **Admin Console:** Batch generation, CSV download, batch status monitoring, and code lookup/revocation.
2. **Student Experience:**
   - Dedicated redemption page at `/me/redeem`.
   - Direct code activation modal on `/course/[id]` when buying a course.

---

## 2. Shared TypeScript Types

Create file `types/accessCode.ts`:

```typescript
export type AccessCodeStatus = 'AVAILABLE' | 'REDEEMED' | 'REVOKED';

export interface AccessBatch {
  id: number;
  courseId: number;
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
  revokedBy?: number | null;
  revokedAt?: string | null;
}

export interface GenerateBatchRequest {
  courseId: number;
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
  label?: string;
  tags: string[];
  codes: string[];
  generatedAt: string;
}

export interface RedeemCodeResponse {
  courseName: string;
  courseId: number;
  enrollmentId: number;
  expiresAt: string;
}

export interface CodeLookupResponse {
  id: number;
  code: string;
  status: AccessCodeStatus;
  courseName: string;
  batchId: number;
  batchLabel?: string;
  redeemedBy?: {
    id: number;
    name: string;
  } | null;
  redeemedAt?: string | null;
}
```

---

## 3. API Client Wrapper

Create file `services/accessCodeService.ts`:

```typescript
import { apiClient } from '@/lib/api-client';
import {
  AccessBatch,
  AccessCodeItem,
  GenerateBatchRequest,
  GenerateBatchResponse,
  RedeemCodeResponse,
  CodeLookupResponse,
} from '@/types/accessCode';

export const accessCodeService = {
  // Student
  async redeemCode(code: string): Promise<RedeemCodeResponse> {
    const res = await apiClient.post<RedeemCodeResponse>('/access-codes/redeem', { code });
    return res.data;
  },

  // Admin
  async generateBatch(payload: GenerateBatchRequest): Promise<GenerateBatchResponse> {
    const res = await apiClient.post<GenerateBatchResponse>('/access-codes/generate', payload);
    return res.data;
  },

  async getBatches(params?: {
    courseId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ batches: AccessBatch[]; pagination: any }> {
    const res = await apiClient.get<{ batches: AccessBatch[]; pagination: any }>(
      '/access-codes/batches',
      { params }
    );
    return res.data;
  },

  async getBatchDetails(
    batchId: number,
    params?: { status?: string; search?: string; page?: number; limit?: number }
  ): Promise<{ batch: AccessBatch; codes: AccessCodeItem[]; pagination: any }> {
    const res = await apiClient.get(`/access-codes/batches/${batchId}`, { params });
    return res.data;
  },

  async downloadBatchCSV(batchId: number): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/access-codes/batches/${batchId}/download`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('فشل تحميل ملف الأكواد.');
    }
    return response.blob();
  },

  async revokeBatch(batchId: number): Promise<{ revokedCount: number }> {
    const res = await apiClient.post<{ revokedCount: number }>('/access-codes/revoke-batch', { batchId });
    return res.data;
  },

  async revokeCodes(codeIds: number[]): Promise<{ revokedCount: number }> {
    const res = await apiClient.post<{ revokedCount: number }>('/access-codes/revoke', { codeIds });
    return res.data;
  },

  async lookupCode(code: string): Promise<CodeLookupResponse> {
    const res = await apiClient.get<CodeLookupResponse>(`/access-codes/lookup/${encodeURIComponent(code)}`);
    return res.data;
  },
};
```

---

## 4. UI Specification: Student Redemption Page (`app/me/redeem/page.tsx`)

### Layout & UX:
- **Heading:** `تفعيل كود الكورس`
- **Subtext:** `أدخل كود التفعيل المطبوع على الكارت لتفعيل اشتراكك فوراً.`
- **Code Input Field:**
  - Auto-capitalizes input.
  - Automatically inserts dashes after every 4 characters (e.g. `XXXX-XXXX`).
  - Trims white spaces.
  - Font: Cairo / Monospace for readability.
- **Action Button:** `تفعيل الكود` with loading spinner.
- **Success State:**
  - Success banner with green checkmark.
  - Displays: Course Name, Activation Date, Valid Until (`صالح لمدة سنة كاملة`).
  - Prominent CTA: `الانتقال إلى الكورس ومتابعة المشاهدة`.
- **Error States:**
  - `422 INVALID_CODE` -> *"هذا الكود غير صالح أو تم استخدامه بالفعل."*
  - `409 ALREADY_ENROLLED` -> *"أنت مشترك بالفعل في هذا الكورس. لم يتم استهلاك الكود."*
  - `429 RATE_LIMITED` -> *"لقد تجاوزت الحد الأقصى للمحاولات. يرجى الانتظار 15 دقيقة."*

---

## 5. UI Specification: Course Page Activation Modal (`app/course/[id]/page.tsx`)

On the course subscribe card:
- If `features.payments` is true: Show `[ الدفع الإلكتروني بالفيزا / فوري ]`
- If `features.accessCodes` is true: Show `[ تفعيل بكود السنتر ]`
- Clicking `تفعيل بكود السنتر` opens a Dialog / Modal right on the page where the student can enter their code and instantly unlock the course without navigating away.

---

## 6. UI Specification: Admin Console Tab (`app/admin/access-codes/page.tsx`)

### Components in Admin Tab:
1. **Header & Stats:**
   - Total Codes Generated, Active / Available, Redeemed, Revoked.
   - Button: `+ إنشاء دفعة جديدة (New Batch)`
2. **New Batch Dialog:**
   - Dropdown of Courses (`GET /courses`).
   - Number Input: Quantity (1 to 10,000, default: 100).
   - Radio Group: Code Length (`8`, `10`, `12` characters).
   - Text Input: Label (e.g., `سنتر الأقصى - الدفعة الأولى`).
   - Text Input: Tags (comma separated).
   - Submit Button triggers generation and automatically triggers CSV download.
3. **Batches Table:**
   - Columns: `رقم الدفعة`, `اسم الكورس`, `البيان / السنتر`, `الكمية`, `المتاح / المستخدم`, `تاريخ الإنشاء`, `الإجراءات`.
   - Actions: `تحميل CSV`, `عرض الأكواد`, `إلغاء الدفعة (Revoke)`.
4. **Code Triage / Lookup Input:**
   - Instant search bar to paste any code and see its state, redemption time, and student info.
