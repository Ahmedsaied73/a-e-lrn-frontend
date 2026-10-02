"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/slices/authSlice";
import { broadcastNotification } from "@/services/notificationService";
import { fetchAllCourses } from "@/services/courseService";
import type { BroadcastAudience } from "@/types/notifications";
import type { GradeEnum } from "@/types/api";
import { PageTitle } from "@/components/page-title";
import { adminTitle } from "@/lib/page-titles";

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
  const [courseSlug, setCourseSlug] = useState("");
  const [grade, setGrade] = useState<GradeEnum>("FIRST_SECONDARY");
  const [courses, setCourses] = useState<{ slug: string; title: string }[]>([]);
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
      if (!courseSlug.trim()) {
        setError("اختر الدورة المستهدفة.");
        return;
      }
      audience = { kind: "course", courseSlug: courseSlug.trim() };
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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8 space-y-6">
      <PageTitle title={adminTitle('إشعارات الطلاب')} />
      <div>
        <h1 className="text-xl font-extrabold text-brand-text">إشعارات الطلاب</h1>
        <p className="mt-1 text-sm text-brand-muted">إرسال إشعار داخل المنصة لشريحة من الطلاب.</p>
      </div>

      <form onSubmit={(e) => void handleSend(e)} className="rounded-2xl border border-brand-border bg-brand-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-semibold text-brand-text">العنوان *
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تم نشر محاضرة جديدة" className="mt-1 w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary outline-none" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-brand-text">الرسالة (اختياري)
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary outline-none" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-brand-text">رابط داخلي (اختياري، مثال: /course/abc123def456)
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} dir="ltr" placeholder="/course/abc123def456" className="mt-1 w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary outline-none" />
          </label>
          <div className="sm:col-span-2 text-sm font-semibold text-brand-text">الجمهور
            <div className="mt-1 flex flex-wrap gap-4 text-sm font-normal text-brand-muted-strong">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="audience" checked={audienceKind === "all"} onChange={() => setAudienceKind("all")} className="h-4 w-4 accent-brand-primary" />
                كل الطلاب
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="audience" checked={audienceKind === "course"} onChange={() => setAudienceKind("course")} className="h-4 w-4 accent-brand-primary" />
                دورة محددة
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="audience" checked={audienceKind === "grade"} onChange={() => setAudienceKind("grade")} className="h-4 w-4 accent-brand-primary" />
                صف دراسي
              </label>
            </div>
          </div>
          {audienceKind === "course" && (
            <label className="text-sm font-semibold text-brand-text">الدورة
              <select value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)} className="mt-1 w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text focus:border-brand-primary outline-none">
                <option value="">اختر الدورة...</option>
                {courses.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.title}</option>
                ))}
              </select>
            </label>
          )}
          {audienceKind === "grade" && (
            <label className="text-sm font-semibold text-brand-text">الصف
              <select value={grade} onChange={(e) => setGrade(e.target.value as GradeEnum)} className="mt-1 w-full rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text focus:border-brand-primary outline-none">
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-3 text-sm font-semibold text-brand-accent">{error}</p>}
        {result && <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{result}</p>}

        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {busy ? "جاري الإرسال..." : "إرسال الإشعار"}
        </button>
      </form>
    </div>
  );
}
