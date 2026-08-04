'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { GradesSection } from "@/components/home/grades-section";
import { Users, BookOpen, Video, Award } from "lucide-react";

const stats = [
  { Icon: Users, value: "+12,000", label: "طالب مشترك" },
  { Icon: BookOpen, value: "+80", label: "كورس تعليمي" },
  { Icon: Video, value: "+1,500", label: "فيديو شرح" },
  { Icon: Award, value: "98%", label: "رضا الطلاب" },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    setIsLoggedIn(!!refreshToken);
  }, []);

  return (
    <div className="container mx-auto px-4 pb-10 pt-6">
      <HeroSection isLoggedIn={isLoggedIn} />

      {/* Stats strip */}
      <section className="-mt-6 relative z-10 mx-auto grid max-w-5xl grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 shadow-card md:grid-cols-4">
        {stats.map(({ Icon, value, label }) => (
          <div key={label} className="flex items-center justify-center gap-3 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div className="text-right">
              <div className="text-xl font-extrabold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </section>

      <FeaturesSection />

      <GradesSection />

      {/* Closing CTA */}
      <section className="ocean-wash relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-card md:p-14">
        <div className="dotted-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl font-extrabold text-foreground text-balance sm:text-4xl">
            جاهز تبدأ رحلتك التعليمية مع <span className="primary-text-gradient">JAW</span>؟
          </h2>
          <p className="text-muted-foreground">
            انضم لآلاف الطلاب اللي بيذاكروا بذكاء وحققوا أعلى الدرجات.
          </p>
          <Link href={isLoggedIn ? "/grades/3" : "/register"}>
            <Button
              size="lg"
              className="primary-gradient rounded-full px-10 py-6 text-base font-bold text-white shadow-card transition-opacity hover:opacity-90"
            >
              {isLoggedIn ? "تصفّح الكورسات" : "انضم إلينا الآن"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
