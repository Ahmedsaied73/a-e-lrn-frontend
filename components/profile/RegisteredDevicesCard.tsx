'use client';

import React, { useEffect, useState } from 'react';
import { Laptop, Smartphone, Tablet, ShieldCheck, HelpCircle } from 'lucide-react';
import { getMyDevices, DeviceInfo, StudentDevicesResponse } from '@/services/deviceService';

function getDeviceIcon(deviceType: string | null) {
  const type = (deviceType || '').toUpperCase();
  if (type === 'MOBILE') {
    return <Smartphone className="h-6 w-6 text-brand-primary" />;
  }
  if (type === 'TABLET') {
    return <Tablet className="h-6 w-6 text-brand-secondary" />;
  }
  return <Laptop className="h-6 w-6 text-brand-primary" />;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function RegisteredDevicesCard() {
  const [data, setData] = useState<StudentDevicesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyDevices()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const maxDevices = data?.maxDevices || 3;
  const devices = data?.devices || [];

  // Build array of slots up to maxDevices (normally 3)
  const slots: (DeviceInfo | null)[] = [];
  for (let i = 0; i < maxDevices; i++) {
    slots.push(devices[i] || null);
  }

  return (
    <section className="rounded-2xl border border-brand-border bg-brand-surface p-6 font-sans" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-brand-border pb-4">
        <div>
          <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-primary" />
            الأجهزة المصرح بها
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            الأجهزة المربوطة بحسابك والمسموح لها بالدخول للمنصة (بحد أقصى {maxDevices} أجهزة)
          </p>
        </div>
        <span className="rounded-full bg-brand-chip px-3 py-1 text-xs font-bold text-brand-primary">
          {devices.length} / {maxDevices} مسجلة
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-brand-chip animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {slots.map((slot, index) => {
            if (slot) {
              return (
                <div
                  key={slot.id || index}
                  className="rounded-xl border border-brand-border bg-brand-bg p-4 flex flex-col justify-between hover:border-brand-primary/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-brand-surface border border-brand-border">
                      {getDeviceIcon(slot.deviceType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-brand-text truncate">
                        {slot.deviceName || 'جهاز غير معروف'}
                      </p>
                      <p className="text-xs text-brand-muted truncate mt-0.5">
                        {slot.browser || ''} {slot.os ? `• ${slot.os}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px] text-brand-muted">
                    <span>آخر نشاط:</span>
                    <span className="font-medium text-brand-text">{formatDate(slot.lastActiveAt)}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`empty-${index}`}
                className="rounded-xl border-2 border-dashed border-brand-border/70 p-4 flex flex-col items-center justify-center text-center text-brand-muted min-h-[112px] bg-brand-surface/40"
              >
                <div className="p-2 rounded-full bg-brand-chip mb-2">
                  <Smartphone className="h-4 w-4 opacity-50" />
                </div>
                <p className="text-xs font-semibold text-brand-text">خانة متاحة لتسجيل جهاز جديد</p>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  سيتم ربط الجهاز تلقائياً عند تسجيل الدخول منه
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl bg-brand-chip/60 border border-brand-border/40 p-3.5 flex items-start gap-2.5 text-xs text-brand-muted leading-relaxed">
        <HelpCircle className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
        <span>
          لحماية حسابك ومنع المشاركة، يسمح بالنفاذ من ٣ أجهزة فقط. إذا كنت ترغب في استبدال أحد أجهزتك المسجلة (مثلاً عند تغيير هاتفك المحمول)، يرجى التواصل مع الدعم الفني لمساعدتك.
        </span>
      </div>
    </section>
  );
}
