"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(2); // عدد الإشعارات كمثال

  const fetchData = async (refreshToken: string) => {
    try {
      const response = await fetch('http://localhost:3005/user/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });
      const data = await response.json();
      return data;
    }
    catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  useEffect(() => {
    const checkAuth = () => {
      const refreshToken = localStorage.getItem('refreshToken');
      setIsAuthenticated(!!refreshToken);
      if (refreshToken) {
        fetchData(refreshToken).then((data) => {
          if (data) {
            setUser({
              name: data.name,
              email: data.email
            });
            console.log(data);
          }
        });
      }
    };

    checkAuth();
  }, []);
  const handleLogout = () => {
    // Clear all user data from localStorage
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    
    setIsAuthenticated(false);
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0A0F1C]/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between py-4">
        {/* القائمة الرئيسية */}
        <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="ML Logo"
                fill
                className="object-contain"
              />
            </Link>
          </div>
          <span className="text-2xl font-bold text-white">MR. Lotfy Zahran</span>
          </div>
          
          {/* روابط التنقل - تظهر فقط للمستخدمين المسجلين */}
          {/* {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6 mr-8">

              <Link href="/exams" className="text-white hover:text-[rgb(var(--primary))] transition-colors font-medium">
                الاختبارات
              </Link>
              <Link href="/schedule" className="text-white hover:text-[rgb(var(--primary))] transition-colors font-medium">
                الجدول
              </Link>
            </div>
          ) */}
  </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* زر الإشعارات */}
              <div className="relative">
                <Button variant="ghost" size="icon" className="text-white hover:bg-[#1f2937]">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold">
                      {notificationCount}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* قائمة المستخدم */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatar-placeholder.png" alt={user?.name || "المستخدم"} />
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        {user?.name?.substring(0, 2) || "مس"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || "المستخدم"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/me/user")}>
                    <User className="ml-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                className="text-white hover:text-[rgb(var(--primary))] transition-colors"
              >
                سجل دخولك
              </Link>
              <Link
                href="/register" 
                className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-[rgb(var(--primary))] hover:bg-[rgb(var(--secondary))] text-white transition-colors"
              >
                انشئ حسابك
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}