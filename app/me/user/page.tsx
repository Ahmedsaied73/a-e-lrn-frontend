'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Lock, BookOpen, CreditCard, Clock, Video, CheckCircle } from 'lucide-react';
import { checkAuthResponse } from '@/utils/auth-utils';

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (refreshToken: string) => {
    try {
      const response = await fetch('http://localhost:3005/user/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });
      
      // Use helper function to check response status
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
    const loadUserData = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const userData = await fetchData(refreshToken);
        if (userData) {
          setUser(userData);
        }
      } else {
        // If there is no token, redirect user to login page
        window.location.href = '/login';
        return;
      }
      setIsLoading(false);
    };
    
    loadUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-white">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      {/* Header with user icon */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="bg-blue-500 rounded-full p-3 mb-2">
          <User className="text-white h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">ملف المستخدم</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - User Info */}
        <div className="md:col-span-1">
          <Card className="bg-[#111827] border-[#1f2937] text-white">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="/avatar-placeholder.png" alt="صورة المستخدم" />
                  <AvatarFallback className="bg-blue-500 text-white text-xl">
                    {user?.name ? user.name.substring(0, 2) : "مس"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold mb-6">{user?.name || "المستخدم"}</h2>
                
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">📱</span>
                    <span dir="ltr">{user?.phoneNumber || "غير متوفر"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">📧</span>
                    <span dir="ltr">{user?.email || "غير متوفر"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="mt-6 space-y-3">
            <Button variant="outline" className="w-full justify-start text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
              <User className="mr-2 h-4 w-4" />
              ملف المستخدم
            </Button>
            <Link href="/me/user/courses">
              <Button variant="outline" className="w-full justify-start text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
                <BookOpen className="mr-2 h-4 w-4" />
                كورساتي
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
              <Clock className="mr-2 h-4 w-4" />
              الأوقات و تاريخ تسجيل الدخول
            </Button>
      
            <Button variant="outline" className="w-full justify-start text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
              <CheckCircle className="mr-2 h-4 w-4" />
              الفواتير
            </Button>
            <Link href="/me/user/subscriptions">
              <Button variant="outline" className="w-full justify-start text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
                <CreditCard className="mr-2 h-4 w-4" />
                الاشتراكات
              </Button>
            </Link>
            <Link href="/me/user/all-exam-results" className="w-full">
              <Button variant="outline" className="w-full justify-start text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
                <CheckCircle className="mr-2 h-4 w-4" />
                نتائج الامتحانات
              </Button>
            </Link>
            <Link href="/me/user/assignments" className="w-full">
              <Button variant="outline" className="w-full justify-start text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
                <CheckCircle className="mr-2 h-4 w-4" />
                نتائج الواجب
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column - Statistics */}
        <div className="md:col-span-2">
          <Card className="bg-[#111827] border-[#1f2937] text-white mb-8">
            <CardHeader>
              <CardTitle className="text-center">
                <span className="text-blue-400">★</span> احصائيات كورساتك <span className="text-blue-400">★</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Circular Progress 1 */}
                <div className="flex flex-col items-center">
                  <div className="relative h-32 w-32 mb-4">
                    <div className="absolute inset-0 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-xl font-bold">0 %</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-opacity-30" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 0)' }}></div>
                  </div>
                  <span className="text-center">متوسط النتائج التي حصلتها</span>
                </div>
                
                {/* Circular Progress 2 */}
                <div className="flex flex-col items-center">
                  <div className="relative h-32 w-32 mb-4">
                    <div className="absolute inset-0 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-xl font-bold">0 %</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-opacity-30" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 0)' }}></div>
                  </div>
                  <span className="text-center">عدد الاختبارات التي حللتها</span>
                </div>
                
                {/* Circular Progress 3 */}
                <div className="flex flex-col items-center">
                  <div className="relative h-32 w-32 mb-4">
                    <div className="absolute inset-0 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-xl font-bold">0 %</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-red-500 border-opacity-30" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 0)' }}></div>
                  </div>
                  <span className="text-center">عدد الفيديوهات شوفتها</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full">0 فيديو</span>
                  <span>من 0</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-cyan-500 text-white px-3 py-1 rounded-full">0 امتحان</span>
                  <span>من 0</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#111827] border-[#1f2937] text-white">
            <CardHeader>
              <CardTitle className="text-center">
                <span className="text-blue-400">★</span> احصائياتك علي المنصة <span className="text-blue-400">★</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span>إجمالي مدة فتح المحاضرات علي الموقع</span>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full">0 دقيقة</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>إجمالي عدد مرات مشاهدة الفيديوهات علي الموقع</span>
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full">0 مرة</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>إجمالي عدد مرات فتح الاختبار</span>
                <span className="bg-cyan-500 text-white px-3 py-1 rounded-full">0 مرة</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>إجمالي عدد مرات إنهاء الاختبارات</span>
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full">0 مرة</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}