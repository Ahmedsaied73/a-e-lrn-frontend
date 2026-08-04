"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, ArrowLeft } from "lucide-react";

export function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="ocean-wash relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="dotted-grid absolute inset-0 opacity-60" />
      <div className="relative grid grid-cols-1 items-center gap-10 p-8 md:p-12 lg:grid-cols-2">
        {/* Copy */}
        <div className="space-y-7 text-center lg:text-right">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            مدعومة بالذكاء الاصطناعي
          </span>

          <h1 className="text-4xl font-extrabold leading-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
            مستقبلك يبدأ{" "}
            <span className="primary-text-gradient">من هنا</span>
          </h1>

          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            منصة تعليمية متكاملة لطلاب الثانوية العامة: شرح احترافي، مراجعات ذكية،
            واختبارات تفاعلية تساعدك تذاكر أسرع وأذكى مع JAW.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link href={isLoggedIn ? "/me/user/subscriptions" : "/register"}>
              <Button
                size="lg"
                className="primary-gradient rounded-full px-8 py-6 text-base font-bold text-white shadow-card transition-opacity hover:opacity-90"
              >
                {isLoggedIn ? "اشتراكاتي" : "ابدأ الآن"}
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/grades/3">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-border bg-background px-8 py-6 text-base font-bold text-foreground hover:bg-accent hover:text-primary"
              >
                <Play className="ml-2 h-5 w-5 text-primary" />
                شوف تجربة المنصة
              </Button>
            </Link>
          </div>
        </div>

        {/* Mascot */}
        <div className="relative mx-auto flex items-center justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-primary/10 blur-3xl sm:h-96 sm:w-96" />
          <div className="relative h-72 w-72 animate-float sm:h-96 sm:w-96">
            <Image
              src="/jaw-mascot.png"
              alt="روبوت JAW التعليمي"
              fill
              priority
              className="object-contain drop-shadow-[0_20px_40px_rgba(32,123,255,0.25)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
