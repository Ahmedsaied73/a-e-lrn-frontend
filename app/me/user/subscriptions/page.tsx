'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UserSubscriptionsPage() {
  // Mock data for subscriptions
  const subscriptions = [
    { id: 1, name: 'اشتراك 1', price: 100 },
    { id: 2, name: 'اشتراك 2', price: 150 },
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Header with subscriptions icon */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="bg-blue-500 rounded-full p-3 mb-2">
          <CreditCard className="text-white h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">الاشتراكات</h1>
      </div>

      {/* Back to profile button */}
      <div className="mb-6">
        <Link href="/me/user">
          <Button variant="outline" className="text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة إلى ملف المستخدم
          </Button>
        </Link>
      </div>

      {/* Subscriptions list */}
      <Card className="bg-[#111827] border-[#1f2937] text-white">
        <CardHeader>
          <CardTitle className="text-center">
            <span className="text-blue-400">★</span> الاشتراكات الحالية <span className="text-blue-400">★</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subscriptions.map((subscription, index) => (
                <div key={index} className="bg-[#1f2937] rounded-lg p-4">
                  {/* Subscription content would go here */}
                  <p>بيانات الاشتراك ستظهر هنا</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl">لا يوجد اشتراكات حالياً</p>
              <p className="text-gray-400 mt-2">يمكنك الاشتراك في الكورسات من صفحة الكورسات الرئيسية</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}