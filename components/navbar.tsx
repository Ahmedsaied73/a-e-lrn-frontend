"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, LogOut, Wallet, Trophy, BookMarked, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { checkAuthResponse } from "@/utils/auth-utils";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/grades/3", label: "الكورسات" },
  { href: "/me/user", label: "إنجازاتي" },
  { href: "/me/user/subscriptions", label: "اشتراكاتي" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(2);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchData = async (refreshToken: string) => {
    try {
      const response = await fetch('http://localhost:3005/user/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (checkAuthResponse(response)) {
        return null;
      }

      const data = await response.json();
      return data;
    }
    catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      setIsAuthenticated(!!refreshToken);
      if (refreshToken) {
        const data = await fetchData(refreshToken);
        if (data) {
          setUser({
            name: data.name,
            email: data.email,
            balance: data.balance ?? data.wallet ?? 0,
          });
          router.refresh();
        } else {
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');

    setIsAuthenticated(false);
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="relative h-11 w-11 rounded-xl bg-accent grid place-items-center overflow-hidden">
            <Image src="/jaw-logo.png" alt="JAW Academy" width={34} height={34} className="object-contain" />
          </div>
          <div className="leading-none">
            <span className="block text-xl font-extrabold text-foreground">JAW Academy</span>
            <span className="block text-[11px] font-medium text-muted-foreground">منصة تعليمية ذكية</span>
          </div>
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full text-muted-foreground hover:text-primary hover:bg-accent"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center text-[10px] font-bold text-destructive-foreground">
                    {notificationCount}
                  </span>
                )}
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:border-primary/40 hover:bg-accent">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/avatar-placeholder.png" alt={user?.name || "المستخدم"} />
                      <AvatarFallback className="primary-gradient text-white text-xs font-bold">
                        {user?.name?.substring(0, 2) || "مس"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-semibold text-foreground max-w-[120px] truncate">
                      {user?.name || "المستخدم"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 rounded-2xl p-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal px-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-bold leading-none text-foreground">{user?.name || "المستخدم"}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user?.email || ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <div className="my-2 flex items-center justify-between rounded-xl bg-accent px-3 py-2.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Wallet className="h-4 w-4" />
                      رصيدك الحالي
                    </div>
                    <span className="text-sm font-extrabold text-foreground">
                      {Number(user?.balance ?? 0).toFixed(2)} جنيه
                    </span>
                  </div>
                  <DropdownMenuItem onClick={() => router.push("/me/user")} className="rounded-lg cursor-pointer gap-2 py-2.5">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>إنجازاتي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/me/user/subscriptions")} className="rounded-lg cursor-pointer gap-2 py-2.5">
                    <BookMarked className="h-4 w-4 text-primary" />
                    <span>اشتراكاتي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/me/user")} className="rounded-lg cursor-pointer gap-2 py-2.5">
                    <User className="h-4 w-4 text-primary" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer gap-2 py-2.5 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full text-muted-foreground hover:text-primary hover:bg-accent"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="القائمة"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                سجل دخولك
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold primary-gradient text-white shadow-card transition-opacity hover:opacity-90"
              >
                انشئ حسابك
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {isAuthenticated && mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container mx-auto flex flex-col py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
