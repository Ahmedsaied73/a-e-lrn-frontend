"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, Instagram, Youtube, Facebook, Send } from "lucide-react";

const quickLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/grades/3", label: "الكورسات" },
  { href: "/me/user", label: "إنجازاتي" },
  { href: "/me/user/subscriptions", label: "اشتراكاتي" },
];

const socials = [
  { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
  { href: "https://youtube.com", label: "YouTube", Icon: Youtube },
  { href: "https://facebook.com", label: "Facebook", Icon: Facebook },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container mx-auto py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 text-right">
          {/* Brand */}
          <div className="lg:order-4 space-y-4">
            <div className="flex items-center justify-end gap-3">
              <div>
                <span className="block text-xl font-extrabold text-foreground">JAW Academy</span>
                <span className="block text-xs text-muted-foreground">منصة تعليمية ذكية</span>
              </div>
              <div className="relative h-11 w-11 rounded-xl bg-accent grid place-items-center overflow-hidden">
                <Image src="/jaw-logo.png" alt="JAW Academy" width={34} height={34} className="object-contain" />
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              منصة تعليمية رائدة تقدم محتوى تعليمي احترافي لطلاب الثانوية العامة مدعوم بالذكاء الاصطناعي.
            </p>
          </div>

          {/* Quick links */}
          <div className="lg:order-3 space-y-4">
            <h3 className="text-base font-bold text-foreground">روابط سريعة</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:order-2 space-y-4">
            <h3 className="text-base font-bold text-foreground">تواصل معنا</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:info@jawacademy.net" className="flex items-center justify-end gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
                  info@jawacademy.net
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                </a>
              </li>
              <li>
                <a href="tel:+201003551841" className="flex items-center justify-end gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
                  +201003551841
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Follow */}
          <div className="lg:order-1 space-y-4">
            <h3 className="text-base font-bold text-foreground">تابعنا</h3>
            <div className="flex justify-end gap-3">
              {socials.map(({ href, label, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
            <Link
              href="https://t.me/jawacademy"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Send className="h-4 w-4" />
              قناة تليجرام
            </Link>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-border" />

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            تم صنع هذه المنصة بهدف تهيئة الطالب من جميع الجوانب
          </p>
          <p className="text-xs text-muted-foreground">
            Developed with care · All Copyrights Reserved © 2025 JAW Academy
          </p>
        </div>
      </div>
    </footer>
  );
}
