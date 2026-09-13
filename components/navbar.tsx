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
    <header className="fixed top-3 inset-x-3 md:inset-x-6 lg:inset-x-12 z-50 rounded-2xl bg-white/60 backdrop-blur-xl ring-1 ring-black/5 shadow-lg shadow-primary/5">
      {/* Liquid-glass grain overlay */}
      <div aria-hidden="true" className="glass-noise pointer-events-none absolute inset-0 rounded-2xl opacity-40 mix-blend-overlay" />
      <div className="relative flex items-center justify-between px-4 lg:px-6 h-16 w-full max-w-7xl mx-auto">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="primary-gradient w-9 h-9 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
            <BookOpen className="w-5 h-5 text-on-primary" />
          </div>
          <span className="flex flex-col leading-tight">
            <span className="font-extrabold text-[18px] text-primary tracking-tight">
              أكاديميا
            </span>
            <span className="text-[10px] font-medium text-on-surface-variant hidden sm:block">
              عبدالهادي موسى للكيمياء
            </span>
          </span>
        </Link>

        {/* ── Desktop Nav (authenticated only) ── */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-surface-container-low/70" dir="rtl">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-[14px] font-semibold rounded-full transition-all duration-200 ${
                    active
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest"
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
                  className="flex items-center gap-2 group"
                  aria-label="قائمة المستخدم"
                >
                  <div className="primary-gradient h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm text-on-primary shadow-xs group-hover:ring-2 group-hover:ring-primary-light transition-all duration-200">
                    {initials}
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[13px] font-bold text-on-surface leading-tight">
                      {user?.name || "المستخدم"}
                    </p>
                  </div>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 w-64 bg-surface-container-lowest text-on-surface rounded-xl shadow-level-3 py-2 z-50 border border-outline-variant/60 animate-in fade-in-0 zoom-in-95 duration-150"
                    dir="rtl"
                  >
                    <div className="px-4 py-3 border-b border-outline-variant/60">
                      <p className="text-sm font-bold truncate">{user?.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate" dir="ltr">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      {PROFILE_LINKS.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                              active
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-surface-container-low text-on-surface"
                            }`}
                          >
                            <Icon className="w-4 h-4 text-primary" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                    <div className="border-t border-outline-variant/60 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-right font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
                aria-label="القائمة"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[14px] font-semibold text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5"
              >
                سجل دخولك
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary text-[14px] font-semibold rounded-lg shadow-primary-glow transition-all duration-200 hover:-translate-y-0.5"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && isAuthenticated && (
        <div
          className="md:hidden mb-1 mx-2 mt-3 rounded-2xl bg-surface-container-lowest/90 backdrop-blur-xl ring-1 ring-black/5 shadow-level-3 px-4 py-4"
          dir="rtl"
        >
          {/* User block */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-outline-variant/60 mb-2">
            <div className="primary-gradient h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm text-on-primary shadow-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-on-surface truncate">{user?.name || "المستخدم"}</p>
              <p className="text-[12px] text-on-surface-variant truncate" dir="ltr">{user?.email}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 text-[15px] font-semibold rounded-xl transition-colors ${
                  pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-outline-variant/60 mt-2 pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[15px] font-semibold text-error rounded-xl hover:bg-error/5 transition-colors text-right"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
                <span className="mr-auto flex items-center gap-1 text-[12px] font-normal text-on-surface-variant">
                  <HelpCircle className="w-3.5 h-3.5" />
                  المساعدة
                </span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}