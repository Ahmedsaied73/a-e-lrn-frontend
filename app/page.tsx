'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Play, Lightbulb, Headphones } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in by looking for refreshToken in localStorage
    const refreshToken = localStorage.getItem('refreshToken');
    setIsLoggedIn(!!refreshToken);
  }, []);

  return (
    <main className="pt-24">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)]">
          <div className="space-y-8 text-center lg:text-right">
            <h1 className="text-6xl font-bold text-white leading-tight">
              الأستاذ{" "}
              <span className="primary-text-gradient">لطفي زهران</span>
            </h1>
            <h2 className="text-3xl text-gray-400 leading-relaxed">
              في مادة الرياضيات ... مفيش
              <br />
              صعوبة هتواجهك تاني
            </h2>
            {isLoggedIn ? (
              <Link href="/me/user/courses">
                <Button 
                  size="lg"
                  className="primary-gradient text-xl px-12 py-8 rounded-full hover:opacity-90 transition-opacity"
                >
                  كورساتي
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg"
                className="primary-gradient text-xl px-12 py-8 rounded-full hover:opacity-90 transition-opacity"
              >
                هتتعلمها معانا 😊
              </Button>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-[rgb(var(--primary))] opacity-20 blur-3xl rounded-full" />
            <div className="relative aspect-square rounded-full overflow-hidden border-4 border-[rgb(var(--primary))]">
              <Image
                src="/teacher.png"
                alt="Mr. Lotfy Zahran"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <section className="py-24">
          <h2 className="text-4xl font-bold text-center mb-20">
            <span className="text-[rgb(var(--secondary))]">حابب</span>{" "}
            <span className="text-white">تعرفنا</span>{" "}
            <span className="text-[rgb(var(--secondary))]">؟..</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Video Quality Card */}
            <div className="bg-[#2A2A3C] rounded-2xl p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-[rgb(var(--primary))] rounded-xl mx-auto flex items-center justify-center">
                <Play className="w-10 h-10 text-white" />
              </div>
              <p className="text-white text-lg leading-relaxed">
                فيديوهات بجودة عالية تقدر تشوفها وقت ما تحب في اي مكان
              </p>
            </div>

            {/* Study System Card */}
            <div className="bg-[#2A2A3C] rounded-2xl p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-[rgb(var(--primary))] rounded-xl mx-auto flex items-center justify-center">
                <Lightbulb className="w-10 h-10 text-white" />
              </div>
              <p className="text-white text-lg leading-relaxed">
                هنختبرك في كل فرع للمادة بامتحانات ونظام يوصلك لأعلي درجة
              </p>
            </div>

            {/* Support Card */}
            <div className="bg-[#2A2A3C] rounded-2xl p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-[rgb(var(--primary))] rounded-xl mx-auto flex items-center justify-center">
                <Headphones className="w-10 h-10 text-white" />
              </div>
              <p className="text-white text-lg leading-relaxed">
                معاك دعم فني علي مدار اليوم ، عشان نقلل مشاكلك ونرد علي استفسارتك
              </p>
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section className="py-24">
          <h2 className="text-4xl font-bold text-center mb-20">
            <span className="text-[rgb(var(--secondary))]">تفتكر</span>{" "}
            <span className="text-white">هنا</span>{" "}
            <span className="text-[rgb(var(--secondary))]">ليه ..؟</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative w-full h-[500px]">
              <Image
                src="/brain.png"
                alt="Brain Character"
                fill
                className="object-contain"
              />
            </div>

            <div className="bg-[#2A2A3C] rounded-2xl p-8 space-y-6">
              <p className="text-white text-xl leading-relaxed text-right">
                مستر لطفي زهران بيقدم طريقة سهلة لتعلم الرياضيات.
              </p>
              <p className="text-white text-xl leading-relaxed text-right">
                هتلاقي فيديوهات بتشرح لك المفاهيم بشكل بسيط وممتع،
                ومعاها تمارين تفاعلية تقدر تطبق اللي تعلمته.
              </p>
              <p className="text-white text-xl leading-relaxed text-right">
                هدفنا إنك تحب الرياضيات وتتعلمها بشكل ممتع وسهل
              </p>
              {isLoggedIn ? (
                <Link href="/me/user/courses">
                  <Button 
                    size="lg"
                    className="primary-gradient text-xl px-12 py-6 rounded-full hover:opacity-90 transition-opacity w-full mt-8"
                  >
                    كورساتي
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg"
                  className="primary-gradient text-xl px-12 py-6 rounded-full hover:opacity-90 transition-opacity w-full mt-8"
                >
                  انضم لعيلتنا دلوقتي
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Academic Years Section */}
        <section className="py-24">
          <h2 className="text-4xl font-bold text-center mb-20">
            <span className="text-[rgb(var(--secondary))]">السنوات</span>{" "}
            <span className="text-white">الدراسية</span>{" "}
            <span className="text-[rgb(var(--secondary))]">..؟</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* First Year */}
            <Link href="/grades/1" className="group cursor-pointer">
              <div className="relative h-[300px] rounded-2xl overflow-hidden">
                <Image
                  src="/grade1.png"
                  alt="الصف الأول الثانوي"
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">الصف الأول الثانوي</h3>
                <p className="text-gray-400">جميع كورسات الصف الأول الثانوي</p>
              </div>
            </Link>

            {/* Second Year */}
            <Link href="/grades/2" className="group cursor-pointer">
            <div className="group cursor-pointer">
              <div className="relative h-[300px] rounded-2xl overflow-hidden">
                <Image
                  src="/grade2.png"
                  alt="الصف الثاني الثانوي"
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">الصف الثاني الثانوي</h3>
                <p className="text-gray-400">جميع كورسات الصف الثاني الثانوي</p>
              </div>
            </div>
            </Link>

            {/* Third Year */}
            <Link href="/grades/3" className="group cursor-pointer">
            <div className="group cursor-pointer">
              <div className="relative h-[300px] rounded-2xl overflow-hidden">
                <Image
                  src="/grade3.png"
                  alt="الصف الثالث الثانوي"
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">الصف الثالث الثانوي</h3>
                <p className="text-gray-400">جميع كورسات الصف الثالث الثانوي</p>
              </div>

            </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}