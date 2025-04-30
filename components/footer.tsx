"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1E2738] py-8 mt-auto">
      <div className="container mx-auto px-4">
        {/* Social Media Icons */}
        <div className="flex justify-center gap-4 mb-6">
          <Link href="https://t.me/username" target="_blank" className="transition-transform hover:scale-110">
            <div className="bg-[#0088cc] p-2 rounded-md w-12 h-12 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M21.5 4.5L2.5 12.5L9.5 13.5L11.5 19.5L16.5 9.5L9.5 13.5"></path>
              </svg>
            </div>
          </Link>
          <Link href="https://instagram.com/username" target="_blank" className="transition-transform hover:scale-110">
            <div className="bg-[#E1306C] p-2 rounded-md w-12 h-12 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
          </Link>
          <Link href="https://youtube.com/channel/username" target="_blank" className="transition-transform hover:scale-110">
            <div className="bg-[#FF0000] p-2 rounded-md w-12 h-12 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </div>
          </Link>
          <Link href="https://facebook.com/username" target="_blank" className="transition-transform hover:scale-110">
            <div className="bg-[#1877F2] p-2 rounded-md w-12 h-12 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </div>
          </Link>
        </div>
        
        {/* WhatsApp Contact */}
        <div className="flex justify-center mb-6">
          <Link 
            href="https://wa.me/01115956226" 
            target="_blank"
            className="flex items-center gap-2 bg-[#2A3447] px-4 py-2 rounded-md hover:bg-[#3A4457] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366" stroke="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="text-white text-lg font-medium">تواصل معنا: 01115956226</span>
          </Link>
        </div>
        
        {/* Divider */}
        <div className="border-t border-[#3A4457] my-6"></div>
        
        {/* Purpose Statement */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="text-center text-white text-lg">
            <div className="flex items-center justify-center gap-4">
              <span className="text-2xl">🧮</span>
              <p>تم صنع هذه المنصة بهدف تهيئة الطالب لـ كامل جوانب الثانوية العامة و ما بعدها</p>
              <span className="text-2xl">🧮</span>
            </div>
          </div>
        </div>
        
        {/* Developer Credits */}
        <div className="text-center text-[#8A94A6] text-sm">
          <p>
            <span className="text-[#4CAF50]">&#60; Developed By &#62;</span> Ahmed Saied <span className="text-[#4CAF50]">&#60; All Copy Rights Reserved ©2025 &#62;</span>
          </p>
        </div>
      </div>
    </footer>
  );
}