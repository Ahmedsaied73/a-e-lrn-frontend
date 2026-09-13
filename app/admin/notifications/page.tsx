"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/slices/authSlice";
import { broadcastNotification } from "@/services/notificationService";
import { fetchAllCourses } from "@/services/courseService";
import type { BroadcastAudience } from "@/types/notifications";
import type { GradeEnum } from "@/types/api";

const GRADES: { value: GradeEnum; label: string }[] = [
  { value: "FIRST_SECONDARY", label: "الأول الثانوي" },
  { value: "SECOND_SECONDARY", label: "الثاني الثانوي" },
  { value: "THIRD_SECONDARY", label: "الثالث الثانوي" },
];

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "تعذر إرسال الإشعار.";
}

export default function AdminNotificationsPage() {
  const user = useAppSelector(selectUser);
  const enabled = user?.features?.notifications !== false;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [audienceKind, setAudienceKind] = useState<"all" | "course" | "grade">("all");
  const [courseId, setCourseId] = useState("");
  const [grade, setGrade] = useState<GradeEnum>("FIRST_SECONDARY");
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    fetchAllCourses(1, 100)
      .then((page) => setCourses(page.data ?? []))
      .catch(() => {});
  }, [enabled]);

  if (!enabled) {
    return (
      <div className="rounded-xl border border-outline-variant/70 bg-card p-8 text-center">
        <Megaphone className="mx-auto h-10 w-10 text-on-surface-variant/50" />
        <h1 className="mt-3 text-xl font-bold text-on-surface">الإشعارات غير مفعّلة</h1>
        <p className="mt-1 text-sm text-on-surface-variant">وحدة الإشعارات معطّلة من إعدادات الخادم.</p>
      </div>
    );
  }

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    let audience: BroadcastAudience = { kind: "all" };
    if (audienceKind === "course") {
      const id = Number(courseId);
      if (!Number.isSafeInteger(id) || id <= 0) {
        setError("اختر الدورة المستهدفة.");
        return;
      }
      audience = { kind: "course", courseId: id };
    } else if (audienceKind === "grade") {
      audience = { kind: "grade", grade };
    }
    setBusy(true);
    try {
      const sent = await broadcastNotification({
        title: title.trim(),
        body: body.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        audience,
      });
      setResult(`تم الإرسال إلى ${sent.count} طالب.`);
      setTitle("");
      setBody("");
      setLinkUrl("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">إشعارات الطلاب</h1>
        <p className="mt-1 text-sm text-on-surface-variant">إرسال إشعار داخل المنصة لشريحة من الطلاب.</p>
      </div>

      <form onSubmit={(e) => void handleSend(e)} className="rounded-xl border border-outline-variant/70 bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-semibold text-on-surface/80">العنوان *
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تم نشر محاضرة جديدة" className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-on-surface/80">الرسالة (اختياري)
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-on-surface/80">رابط داخلي (اختياري، مثال: /course/1)
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} dir="ltr" placeholder="/course/1" className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20" />
          </label>
          <div className="sm:col-span-2 text-sm font-semibold text-on-surface/80">الجمهور
            <div className="mt-1 flex flex-wrap gap-4 text-sm font-normal">
              <label className="inline-flex items-center gap-1.5">
                <input type="radio" name="audience" checked={audienceKind === "all"} onChange={() => setAudienceKind("all")} className="h-4 w-4 accent-primary-color" />
                كل الطلاب
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input type="radio" name="audience" checked={audienceKind === "course"} onChange={() => setAudienceKind("course")} className="h-4 w-4 accent-primary-color" />
                دورة محددة
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input type="radio" name="audience" checked={audienceKind === "grade"} onChange={() => setAudienceKind("grade")} className="h-4 w-4 accent-primary-color" />
                صف دراسي
              </label>
            </div>
          </div>
          {audienceKind === "course" && (
            <label className="text-sm font-semibold text-on-surface/80">الدورة
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20">
                <option value="">اختر الدورة...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
          )}
          {audienceKind === "grade" && (
            <label className="text-sm font-semibold text-on-surface/80">الصف
              <select value={grade} onChange={(e) => setGrade(e.target.value as GradeEnum)} className="mt-1 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20">
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {result && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{result}</p>}

        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-color px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#0057c0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {busy ? "جاري الإرسال..." : "إرسال الإشعار"}
        </button>
      </form>
    </div>
  );
}
