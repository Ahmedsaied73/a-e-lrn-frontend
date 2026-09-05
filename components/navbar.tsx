"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, User, LogOut, Menu, X, BookOpen, Trophy, CreditCard, HelpCircle } from "lucide-react";
import { logoutUser } from "@/services/authService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated, selectUser, logout } from "@/store/slices/authSlice";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/grades/1", label: "الدورات" },
  { href: "/me/user/achievements", label: "إنجازاتي" },
  { href: "/me/user/subscriptions", label: "اشتراكاتي" },
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
    router.push("/login");
  };

  const initials = user?.name?.substring(0, 2)?.toUpperCase() || "م";

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-4 lg:px-12 h-16 w-full max-w-7xl mx-auto">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-9 h-9 bg-[#207bff] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-[18px] text-[#207bff] tracking-tight hidden sm:block">
            أكاديميا
          </span>
        </Link>

        {/* ── Desktop Nav (authenticated only) ── */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 h-full" dir="rtl">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-[14px] font-semibold rounded-lg transition-all duration-200 ${
                    active
                      ? "text-[#207bff] bg-[#207bff]/8"
                      : "text-gray-600 hover:text-[#207bff] hover:bg-[#207bff]/5"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 right-3 left-3 h-0.5 bg-[#207bff] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Bell */}
              <button
                aria-label="الإشعارات"
                className="relative p-2 rounded-full border-2 border-[#4ea5ff]/60 text-[#4ea5ff] hover:bg-[#207bff]/8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#207bff]/30"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              </button>

              {/* Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 group"
                  aria-label="قائمة المستخدم"
                >
                  <div className="h-9 w-9 rounded-full bg-[#207bff] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:ring-2 group-hover:ring-[#4ea5ff] transition-all duration-200">
                    {initials}
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">
                      {user?.name || "المستخدم"}
                    </p>
                  </div>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 w-64 bg-[#111827] text-white rounded-xl shadow-level-3 py-2 z-50 border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-150"
                    dir="rtl"
                  >
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-bold">{user?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                    </div>
                    <Link
                      href="/me/user"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-[#4ea5ff]" />
                      الملف الشخصي
                    </Link>
                    <Link
                      href="/me/user/courses"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-[#4ea5ff]" />
                      كورساتي
                    </Link>
                    <div className="border-t border-gray-700 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors text-right"
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
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="القائمة"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[14px] font-semibold text-gray-600 hover:text-[#207bff] transition-colors px-3 py-1.5"
              >
                سجل دخولك
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 bg-[#207bff] hover:bg-[#1a6bdf] text-white text-[14px] font-semibold rounded-lg shadow-primary-glow transition-all duration-200 hover:-translate-y-0.5"
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
          className="md:hidden bg-white border-t border-gray-100 shadow-level-3 px-4 py-4"
          dir="rtl"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 text-[15px] font-semibold rounded-lg transition-colors ${
                  pathname === link.href
                    ? "text-[#207bff] bg-[#207bff]/8"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}