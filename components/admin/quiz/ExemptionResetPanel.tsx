"use client";

import { useState } from "react";
import { grantQuizExemption, revokeQuizExemption } from "@/services/adminQuizService";

interface ExemptionResetPanelProps {
  videoId: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "تعذر تنفيذ العملية.";
}

export default function ExemptionResetPanel({ videoId }: ExemptionResetPanelProps) {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [exemptionId, setExemptionId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const grant = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      setError("أدخل رقم مستخدم صحيحاً.");
      return;
    }
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      await grantQuizExemption(videoId, parsedUserId, reason.trim() || undefined);
      setMessage("تم منح الاستثناء بنجاح.");
      setReason("");
    } catch (grantError) {
      setError(errorMessage(grantError));
    } finally {
      setWorking(false);
    }
  };

  const revoke = async () => {
    const parsedExemptionId = Number(exemptionId);
    if (!Number.isInteger(parsedExemptionId) || parsedExemptionId <= 0) {
      setError("أدخل رقم استثناء صحيحاً.");
      return;
    }
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      await revokeQuizExemption(parsedExemptionId);
      setMessage("تم إلغاء الاستثناء بنجاح.");
      setExemptionId("");
    } catch (revokeError) {
      setError(errorMessage(revokeError));
    } finally {
      setWorking(false);
    }
  };

  return (
    <section dir="rtl" className="rounded-xl border border-outline-variant/70 bg-card p-6">
      <h2 className="text-xl font-bold text-on-surface">صلاحيات تجاوز بوابة الاختبار</h2>
      <p className="mt-1 text-sm text-on-surface-variant">الفيديو الحالي: {videoId}. يتطلب الإلغاء رقم الاستثناء من النظام.</p>
      <form onSubmit={grant} className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-on-surface/80">رقم الطالب
          <input value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20" />
        </label>
        <label className="text-sm font-semibold text-on-surface/80 sm:col-span-2">سبب الاستثناء
          <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20" />
        </label>
        <button type="submit" disabled={working} className="rounded-lg bg-primary-color px-4 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#0057c0] disabled:opacity-50 disabled:cursor-not-allowed">منح الاستثناء</button>
      </form>
      <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-outline-variant/50 pt-5">
        <label className="text-sm font-semibold text-on-surface/80">رقم الاستثناء
          <input value={exemptionId} onChange={(event) => setExemptionId(event.target.value)} className="mt-1 w-48 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20" />
        </label>
        <button type="button" onClick={() => void revoke()} disabled={working} className="rounded-lg border border-red-200 px-4 py-2.5 font-semibold text-red-600 transition-colors duration-150 hover:border-red-400 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed">إلغاء الاستثناء</button>
      </div>
      {message && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </section>
  );
}