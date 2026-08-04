"use client";

import { PlayCircle, Brain, Headphones, LineChart } from "lucide-react";

const features = [
  {
    Icon: PlayCircle,
    title: "فيديوهات بجودة عالية",
    desc: "شرح احترافي تقدر تشوفه في أي وقت ومن أي مكان بجودة واضحة.",
  },
  {
    Icon: Brain,
    title: "مراجعات ذكية",
    desc: "نظام مراجعة مبني على الذكاء الاصطناعي يركّز على نقاط ضعفك.",
  },
  {
    Icon: LineChart,
    title: "اختبارات تفاعلية",
    desc: "امتحانات وواجبات تفاعلية بتقيس مستواك وتوصلك لأعلى درجة.",
  },
  {
    Icon: Headphones,
    title: "دعم على مدار اليوم",
    desc: "فريق دعم فني جاهز يرد على استفساراتك ويحل مشاكلك أول بأول.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          ليه <span className="primary-text-gradient">JAW Academy</span>؟
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          كل اللي محتاجه علشان تذاكر أسرع وأذكى في مكان واحد.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ Icon, title, desc }) => (
          <div
            key={title}
            className="group rounded-2xl border border-border bg-card p-6 text-right shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
          >
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary transition-colors group-hover:primary-gradient group-hover:text-white">
              <Icon className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
