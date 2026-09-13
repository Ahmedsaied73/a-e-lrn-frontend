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

  // Hide the site chrome inside the admin console (it has its own shell).
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="fixed top-3 inset-x-3 md:inset-x-6 lg:inset-x-12 z-50">
      <div className="relative mx-auto max-w-5xl">
        <div className="glass-nav pointer-events-none absolute inset-0 rounded-full border border-white/30 bg-brand-surface/60 shadow-lg shadow-brand-text/10 backdrop-blur-xl" aria-hidden="true" />
        <div className="relative z-10 flex h-16 items-center justify-between gap-4 px-4 sm:px-6">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 text-brand-primary shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-primary text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 5.5C6.5 4.2 9 4 12 5v14c-3-1-5.5-.8-8 .5V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M20 5.5C17.5 4.2 15 4 12 5v14c3-1 5.5-.8 8 .5V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold">
              أكاديميا
            </span>
            <span className="text-[10px] font-medium text-brand-muted hidden sm:block">
              عبدالهادي موسى للكيمياء
            </span>
          </span>
        </Link>

        {/* ── Desktop Nav (authenticated only) ── */}
        {isAuthenticated && (
          <nav className="hidden items-center gap-1 md:flex" dir="rtl">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium text-brand-muted-strong transition hover:bg-brand-chip hover:text-brand-primary ${
                    active ? "text-brand-primary" : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NotificationBell />

              {/* Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-brand-secondary text-sm font-bold text-white"
                  aria-label="قائمة المستخدم"
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
                        onClick={handleLogout}
                        className="mt-1 block w-full rounded-lg px-3 py-2 text-start text-sm font-medium text-brand-accent hover:bg-red-50"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-md border border-brand-border text-brand-muted-strong md:hidden"
                aria-label="القائمة"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-brand-muted-strong transition hover:bg-brand-chip hover:text-brand-primary"
              >
                سجل دخولك
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary/90"
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
        <nav
          className="glass-nav mx-auto mt-2 flex max-w-5xl flex-col gap-1 rounded-2xl border border-white/30 bg-brand-surface/60 p-2 shadow-lg backdrop-blur-xl md:hidden"
          dir="rtl"
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
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-accent rounded-lg hover:bg-red-50 transition-colors text-start"
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
      )}
    </header>
  );
}