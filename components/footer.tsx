import Link from "next/link";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path
          fill="white"
          d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M21.198 2.433a2.242 2.242 0 00-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 01-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 4.654 1.472.5 1.704 1.003 3.399 1.287 4.43.25.89.366 1.254.772 1.427.22.093.476.105.733-.034.4-.212.558-.552.558-.552l2.55-2.517 4.714 3.488.078.04c.826.354 1.673-.014 2.039-.78.385-.804 2.814-13.44 2.814-13.44.166-.684.036-1.349-.414-1.744a2.07 2.07 0 00-1.027-.324z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer
      className="w-full bg-[#f5f7fa] border-t border-gray-200 pt-10 pb-6 font-sans"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-12 flex flex-col items-center gap-6">
        {/* Social Links */}
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="w-10 h-10 bg-[#207bff] hover:bg-[#4ea5ff] text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              {s.icon}
            </Link>
          ))}
        </div>

        {/* WhatsApp Contact */}
        <Link
          href="https://wa.me/201115956226"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-xl border border-[#4ea5ff]/30 shadow-level-2 hover:shadow-level-3 transition-all duration-200 hover:-translate-y-0.5 group"
        >
          {/* WhatsApp Icon */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#25d366]">
            <path d="M20.52 3.449C18.245 1.173 15.195 0 12.045 0 5.463 0 .104 5.373.104 12.017c0 2.118.547 4.183 1.589 5.997L0 24l6.138-1.61a11.944 11.944 0 005.897 1.506h.005c6.578 0 11.937-5.374 11.937-12.018 0-3.211-1.247-6.23-3.457-8.429zM12.045 22.007h-.004a9.913 9.913 0 01-5.051-1.38l-.362-.215-3.753.985.999-3.655-.235-.374a9.96 9.96 0 01-1.524-5.319c0-5.513 4.481-9.998 9.994-9.998 2.668 0 5.177 1.04 7.064 2.929a9.97 9.97 0 012.924 7.075c-.002 5.515-4.483 9.952-9.952 9.952zm5.473-7.462c-.3-.15-1.776-.876-2.051-.977-.275-.1-.475-.15-.674.15-.2.3-.774.976-.949 1.176-.175.2-.349.225-.649.075-.3-.15-1.267-.467-2.413-1.49-.892-.795-1.494-1.777-1.67-2.077-.175-.3-.018-.462.131-.61.134-.134.3-.35.449-.524.15-.175.2-.3.3-.499.1-.2.05-.374-.025-.524-.075-.15-.674-1.626-.924-2.226-.243-.585-.49-.505-.674-.514-.174-.009-.374-.011-.574-.011-.2 0-.524.075-.799.374-.275.3-1.049 1.025-1.049 2.5s1.074 2.9 1.224 3.1c.15.2 2.113 3.227 5.12 4.525.717.309 1.276.494 1.712.632.72.228 1.374.196 1.892.119.577-.086 1.776-.726 2.026-1.426.25-.7.25-1.3.175-1.426-.074-.127-.274-.2-.574-.35z" />
          </svg>
          <span className="font-semibold text-[15px] text-[#207bff]">01115956226</span>
          <span className="text-[14px] text-gray-500">:تواصل معنا</span>
        </Link>

        {/* Divider */}
        <div className="w-3/4 h-px bg-[#4ea5ff]/20" />

        {/* Mission Statement */}
        <div className="flex items-center gap-3 text-center">
          <div className="flex flex-col gap-1 flex-shrink-0">
            <div className="h-1.5 w-4 bg-[#4ea5ff] rounded-full" />
            <div className="h-1.5 w-4 bg-[#207bff] rounded-full" />
            <div className="h-1.5 w-4 bg-[#4ea5ff] rounded-full" />
          </div>
          <p className="text-[15px] text-gray-700 leading-relaxed max-w-lg">
            تم صنع هذه المنصة بهدف تهيئة الطالب لـ كامل جوانب الثانوية العامة و ما بعدها
          </p>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <div className="h-1.5 w-4 bg-[#4ea5ff] rounded-full" />
            <div className="h-1.5 w-4 bg-[#207bff] rounded-full" />
            <div className="h-1.5 w-4 bg-[#4ea5ff] rounded-full" />
          </div>
        </div>

        {/* Copyright */}
        <p className="text-[12px] text-gray-400 tracking-wider">
          &lt; Developed By &gt; Ahmed Saied &lt; All Copy Rights Reserved ©2025 &gt;
        </p>
      </div>
    </footer>
  );
}