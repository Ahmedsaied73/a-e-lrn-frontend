"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const QUICK_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/grades/1", label: "الدورات" },
  { href: "/me/user/achievements", label: "إنجازاتي" },
  { href: "/me/user/subscriptions", label: "اشتراكاتي" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "تسجيل الدخول" },
  { href: "/register", label: "إنشاء حساب" },
  { href: "/me/user", label: "الملف الشخصي" },
  { href: "/me/user/courses", label: "كورساتي" },
];

const SOCIALS = [
  {
    label: "تيليجرام",
    href: "#",
    path: "M21 4 3 11.2l5.2 1.7L9.6 18l3-3.1 4.9 3.6L21 4Zm-9.9 8.4 6.7-5-5.2 6-1 3-.5-4Z",
  },
  {
    label: "يوتيوب",
    href: "#",
    path: "M21.6 7.6c-.2-1-1-1.8-2-2C17.9 5 12 5 12 5s-5.9 0-7.6.6c-1 .2-1.8 1-2 2C2 9.4 2 12 2 12s0 2.6.4 4.4c.2 1 1 1.8 2 2C6.1 19 12 19 12 19s5.9 0 7.6-.6c1-.2 1.8-1 2-2 .4-1.8.4-4.4.4-4.4s0-2.6-.4-4.4ZM10 15.5v-7l6 3.5-6 3.5Z",
  },
  {
    label: "فيسبوك",
    href: "#",
    path: "M14 8.5h2.5V5.7c-.4-.1-1.6-.2-3-.2-3 0-5 1.8-5 5.1v2.6H5.8v3.2h2.7V22h3.3v-5.6h2.7l.4-3.2h-3.1v-2.2c0-.9.3-1.5 1.7-1.5Z",
  },
  {
    label: "سناب شات",
    href: "#",
    path: "M12 2c2.8 0 4.3 1.9 4.4 4.2l.1 2c.5.3 1.1.4 1.6.2.5-.1.9.3.8.8-.1.6-.9 1-1.6 1.3.1.5.5 1.6 2 1.9.4.1.6.6.4 1-.5.9-1.9 1.1-2.8 1.2-.1.3-.3.9-.6 1.2-.5.6-1.5.3-2.2.6-.6.3-1.2 1.1-2.1 1.1s-1.5-.8-2.1-1.1c-.7-.3-1.7 0-2.2-.6-.3-.3-.5-.9-.6-1.2-.9-.1-2.3-.3-2.8-1.2-.2-.4 0-.9.4-1 1.5-.3 1.9-1.4 2-1.9-.7-.3-1.5-.7-1.6-1.3-.1-.5.3-.9.8-.8.5.2 1.1.1 1.6-.2l.1-2C7.7 3.9 9.2 2 12 2Z",
  },
];

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Hidden inside the admin console (it has its own shell)
  // and on the auth pages (they are chromeless full-screen splits).
  if (pathname.startsWith("/admin") || pathname === "/login" || pathname === "/register") {
    return null;
  }

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  }

  return (
    <footer className="relative mt-10 bg-brand-ink text-white/70" dir="rtl">
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        className="block h-6 w-full text-brand-bg"
        aria-hidden="true"
      >
        <path d="M0 20 Q150 40 300 20 T600 20 T900 20 T1200 20 V0 H0 Z" fill="currentColor" />
      </svg>

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-2 sm:px-6">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 text-white">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-primary text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 5.5C6.5 4.2 9 4 12 5v14c-3-1-5.5-.8-8 .5V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M20 5.5C17.5 4.2 15 4 12 5v14c3-1 5.5-.8 8 .5V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-lg font-extrabold">أكاديميا</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              تم صنع هذه المنصة بهدف تهيئة الطالب لـ كامل جوانب الثانوية العامة و ما بعدها
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-brand-primary hover:text-white"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
            <Link
              href="https://wa.me/201115956226"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 transition hover:border-brand-primary"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#25d366]">
                <path d="M20.52 3.449C18.245 1.173 15.195 0 12.045 0 5.463 0 .104 5.373.104 12.017c0 2.118.547 4.183 1.589 5.997L0 24l6.138-1.61a11.944 11.944 0 005.897 1.506h.005c6.578 0 11.937-5.374 11.937-12.018 0-3.211-1.247-6.23-3.457-8.429zM12.045 22.007h-.004a9.913 9.913 0 01-5.051-1.38l-.362-.215-3.753.985.999-3.655-.235-.374a9.96 9.96 0 01-1.524-5.319c0-5.513 4.481-9.998 9.994-9.998 2.668 0 5.177 1.04 7.064 2.929a9.97 9.97 0 012.924 7.075c-.002 5.515-4.483 9.952-9.952 9.952zm5.473-7.462c-.3-.15-1.776-.876-2.051-.977-.275-.1-.475-.15-.674.15-.2.3-.774.976-.949 1.176-.175.2-.349.225-.649.075-.3-.15-1.267-.467-2.413-1.49-.892-.795-1.494-1.777-1.67-2.077-.175-.3-.018-.462.131-.61.134-.134.3-.35.449-.524.15-.175.2-.3.3-.499.1-.2.05-.374-.025-.524-.075-.15-.674-1.626-.924-2.226-.243-.585-.49-.505-.674-.514-.174-.009-.374-.011-.574-.011-.2 0-.524.075-.799.374-.275.3-1.049 1.025-1.049 2.5s1.074 2.9 1.224 3.1c.15.2 2.113 3.227 5.12 4.525.717.309 1.276.494 1.712.632.72.228 1.374.196 1.892.119.577-.086 1.776-.726 2.026-1.426.25-.7.25-1.3.175-1.426-.074-.127-.274-.2-.574-.35z" />
              </svg>
              <span className="font-semibold text-[15px] text-white" dir="ltr">01115956226</span>
              <span className="text-[14px] text-white/70">:تواصل معنا</span>
            </Link>
          </div>

          <div>
            <p className="text-sm font-bold text-white">روابط سريعة</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-white">الحساب</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-white">نصيحة كيميائية أسبوعية</p>
            <p className="mt-4 text-sm leading-relaxed">
              اشترك لتصلك أسئلة مراجعة قصيرة وتذكيرات بمواعيد الاختبارات كل أسبوع.
            </p>
            {subscribed ? (
              <p className="mt-4 text-sm font-semibold text-brand-primary">تم الاشتراك، أهلًا بك 🎉</p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-4 flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-primary"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary/90"
                >
                  اشترك
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-xs text-white/40 sm:flex-row">
          <p>&lt; Developed By &gt; Ahmed Saied &lt; All Copy Rights Reserved ©2025 &gt;</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-white/60 transition hover:border-brand-primary hover:text-white"
          >
            العودة للأعلى
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="m6 15 6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
