"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, LogOut, Menu, X, BookOpen, Trophy, CreditCard, HelpCircle } from "lucide-react";
import { logoutUser } from "@/services/authService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated, selectUser, logout } from "@/store/slices/authSlice";
import NotificationBell from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/grades/1", label: "الدورات" },
  { href: "/me/user/achievements", label: "إنجازاتي" },
  { href: "/me/user/subscriptions", label: "اشتراكاتي" },
];

const PROFILE_LINKS = [
  { href: "/me/user", label: "الملف الشخصي", icon: User },
  { href: "/me/user/courses", label: "كورساتي", icon: BookOpen },
  { href: "/me/user/achievements", label: "إنجازاتي", icon: Trophy },
  { href: "/me/user/subscriptions", label: "الاشتراكات", icon: CreditCard },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  // Auth state now comes from Redux (hydrated once by AuthInitializer and
  // updated instantly on login/logout) instead of an independent fetch here.
  // That's what fixes both the duplicate "/user/me" requests and the
  // "stays logged out until refresh" bug — this now re-renders reactively
  // the moment login/logout dispatch to the store, no remount needed.
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  const initials = user?.name?.substring(0, 2)?.toUpperCase() || "م";

  // Hide the site chrome inside the admin console (it has its own shell)
  // and on the auth pages (they are chromeless full-screen splits).
  if (pathname.startsWith("/admin") || pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 lg:px-12">
      <div className="relative mx-auto max-w-6xl">
        {/* Grain/blur layer — clipped to the pill and pointer-transparent, so the
            avatar dropdown below can overflow without being cut off. */}
        <div
          className="glass-nav glass-pill pointer-events-none absolute inset-0 border border-brand-border/50 bg-brand-surface/70 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-brand-surface/60"
          aria-hidden="true"
        />
        <div className="relative z-10 flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6" dir="rtl">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 text-brand-primary shrink-0" aria-label="أكاديميا — الرئيسية">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-primary text-white shadow-sm sm:h-10 sm:w-10">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 5.5C6.5 4.2 9 4 12 5v14c-3-1-5.5-.8-8 .5V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M20 5.5C17.5 4.2 15 4 12 5v14c3-1 5.5-.8 8 .5V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-extrabold text-brand-primary sm:text-lg">
              أكاديميا
            </span>
            <span className="text-[10px] font-medium text-brand-muted hidden sm:block">
              عبدالهادي موسى للكيمياء
            </span>
          </span>
        </Link>

        {/* ── Desktop Nav (authenticated only) ── */}
        {isAuthenticated && (
          <nav className="hidden items-center gap-1 md:flex" dir="rtl" aria-label="التنقل الرئيسي">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-md px-4 py-2 text-[15px] font-semibold transition hover:bg-brand-chip hover:text-brand-primary ${
                    active ? "text-brand-primary" : "text-brand-muted-strong"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ── Left Controls ── */}
        <div className="relative z-10 flex items-center gap-2.5" dir="rtl">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NotificationBell />

              {/* Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-brand-secondary text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
                  aria-label="قائمة المستخدم"
                  aria-expanded={dropdownOpen}
                >
                  {initials}
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute end-0 top-full mt-2 w-56 rounded-xl border border-brand-border bg-brand-surface p-2 shadow-lg z-50"
                    dir="rtl"
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-brand-text truncate">{user?.name}</p>
                      <p className="text-xs text-brand-muted mt-0.5 truncate" dir="ltr">
                        {user?.email}
                      </p>
                    </div>
                    <div className="my-1 h-px bg-brand-chip" />
                    <div className="py-1">
                      {PROFILE_LINKS.map((item) => {
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDropdownOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm text-brand-muted-strong hover:bg-brand-hover"
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                    <div className="border-t border-brand-border mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 block w-full cursor-pointer rounded-lg px-3 py-2 text-start text-sm font-medium text-brand-accent hover:bg-red-50"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-brand-border bg-brand-surface/60 text-brand-muted-strong transition hover:border-brand-primary/40 hover:bg-brand-chip hover:text-brand-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 md:hidden"
                aria-label={mobileMenuOpen ? "إغلاق القائمة" : "القائمة"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-md px-2 py-2 text-[13px] font-medium text-brand-muted-strong transition hover:bg-brand-chip hover:text-brand-primary sm:px-3 sm:text-sm"
              >
                سجل دخولك
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap rounded-full bg-brand-primary px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-brand-primary/90 sm:px-5 sm:text-sm"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="glass-nav glass-mobile relative mt-2 mx-3 border border-brand-border/50 bg-brand-surface/90 p-1 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-brand-surface/70 sm:mx-0 md:hidden">
        <nav
          className="relative z-10 flex w-full flex-col gap-1 p-2"
          dir="rtl"
          aria-label="قائمة الجوال"
        >
          {/* User block */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-brand-border mb-2">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-secondary text-sm font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-brand-text truncate">{user?.name || "المستخدم"}</p>
              <p className="text-[12px] text-brand-muted truncate" dir="ltr">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-brand-muted-strong hover:bg-brand-surface"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-brand-border mt-2 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium text-brand-accent rounded-lg hover:bg-red-50 transition-colors text-start"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
                <span className="ms-auto flex items-center gap-1 text-[12px] font-normal text-brand-muted">
                  <HelpCircle className="w-3.5 h-3.5" />
                  المساعدة
                </span>
              </button>
            </div>
          </div>
        </nav>
        </div>
      )}
    </header>
  );
}