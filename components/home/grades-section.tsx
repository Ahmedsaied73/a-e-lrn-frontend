"use client";

import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";

const grades = [
  { id: 1, title: "الصف الأول الثانوي", desc: "جميع كورسات الصف الأول الثانوي" },
  { id: 2, title: "الصف الثاني الثانوي", desc: "جميع كورسات الصف الثاني الثانوي" },
  { id: 3, title: "الصف الثالث الثانوي", desc: "جميع كورسات الصف الثالث الثانوي" },
];

export function GradesSection() {
  return (
    <section className="py-16">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          السنوات <span className="primary-text-gradient">الدراسية</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          اختر سنتك الدراسية واستكشف الكورسات المتاحة لها.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {grades.map((grade) => (
          <Link
            key={grade.id}
            href={`/grades/${grade.id}`}
            className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
          >
            <div className="ocean-wash relative flex h-40 items-center justify-center overflow-hidden">
              <div className="dotted-grid absolute inset-0 opacity-50" />
              <span className="relative text-7xl font-black text-primary/25 transition-transform group-hover:scale-110">
                0{grade.id}
              </span>
              <GraduationCap className="absolute h-14 w-14 text-primary" />
            </div>
            <div className="flex items-center justify-between p-6 text-right">
              <div>
                <h3 className="text-lg font-bold text-foreground">{grade.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{grade.desc}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-primary transition-all group-hover:primary-gradient group-hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
