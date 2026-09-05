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
    <section dir="rtl" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">صلاحيات تجاوز بوابة الاختبار</h2>
      <p className="mt-1 text-sm text-slate-500">الفيديو الحالي: {videoId}. يتطلب الإلغاء رقم الاستثناء من النظام.</p>
      <form onSubmit={grant} className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">رقم الطالب<input value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">سبب الاستثناء<input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>
        <button type="submit" disabled={working} className="rounded-lg bg-[#207bff] px-4 py-2.5 font-bold text-white disabled:opacity-50">منح الاستثناء</button>
      </form>
      <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5"><label className="text-sm font-semibold text-slate-700">رقم الاستثناء<input value={exemptionId} onChange={(event) => setExemptionId(event.target.value)} className="mt-1 w-48 rounded-lg border border-slate-300 p-2.5" /></label><button type="button" onClick={() => void revoke()} disabled={working} className="rounded-lg border border-rose-200 px-4 py-2.5 font-semibold text-rose-700 disabled:opacity-50">إلغاء الاستثناء</button></div>
      {message && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
    </section>
  );
}
