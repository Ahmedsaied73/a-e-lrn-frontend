'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Smartphone,
  Laptop,
  Tablet,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  getStudentDevices,
  unbindStudentDevice,
  resetStudentDevices,
  updateStudentDeviceLimit,
  DeviceInfo,
} from '@/services/deviceService';
import type { AdminUser } from '@/types/admin';

interface StudentDevicesDialogProps {
  student: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

function getDeviceIcon(deviceType: string | null) {
  const type = (deviceType || '').toUpperCase();
  if (type === 'MOBILE') {
    return <Smartphone className="h-4 w-4 text-brand-primary" />;
  }
  if (type === 'TABLET') {
    return <Tablet className="h-4 w-4 text-brand-secondary" />;
  }
  return <Laptop className="h-4 w-4 text-brand-primary" />;
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

export function StudentDevicesDialog({
  student,
  isOpen,
  onClose,
}: StudentDevicesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [maxDevices, setMaxDevices] = useState(3);
  const [customLimit, setCustomLimit] = useState('3');
  const [savingLimit, setSavingLimit] = useState(false);

  // Unbind single device state
  const [unbindingDevice, setUnbindingDevice] = useState<DeviceInfo | null>(null);
  const [unbindBusy, setUnbindBusy] = useState(false);

  // Reset all devices state
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const fetchDevices = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await getStudentDevices(student.slug);
      setDevices(res.devices);
      setActiveCount(res.activeCount);
      setMaxDevices(res.maxDevices);
      setCustomLimit(String(res.maxDevices));
    } catch (err: unknown) {
      toast.error('تعذر جلب بيانات الأجهزة المسجلة للطالب');
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    if (isOpen && student) {
      fetchDevices();
    }
  }, [isOpen, student, fetchDevices]);

  async function handleUnbindConfirm() {
    if (!student || !unbindingDevice) return;
    setUnbindBusy(true);
    try {
      await unbindStudentDevice(student.slug, unbindingDevice.deviceIdentifier);
      toast.success('تم إلغاء ربط الجهاز بنجاح');
      setUnbindingDevice(null);
      await fetchDevices();
    } catch (err: unknown) {
      toast.error('فشل إلغاء ربط الجهاز');
    } finally {
      setUnbindBusy(false);
    }
  }

  async function handleResetAllConfirm() {
    if (!student) return;
    setResetBusy(true);
    try {
      const res = await resetStudentDevices(student.slug);
      toast.success(`تمت إعادة تعيين الأجهزة (${res.count} جهاز)`);
      setResetConfirmOpen(false);
      await fetchDevices();
    } catch (err: unknown) {
      toast.error('فشل إعادة تعيين أجهزة الطالب');
    } finally {
      setResetBusy(false);
    }
  }

  async function handleSaveLimit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    const limitNum = Number(customLimit);
    if (!Number.isSafeInteger(limitNum) || limitNum < 1) {
      toast.error('يرجى إدخال عدد صحيح أكبر من صفر');
      return;
    }
    setSavingLimit(true);
    try {
      const res = await updateStudentDeviceLimit(student.slug, limitNum);
      setMaxDevices(res.maxDevices);
      toast.success('تم تحديث الحد الأقصى للأجهزة');
    } catch (err: unknown) {
      toast.error('فشل تحديث الحد الأقصى للأجهزة');
    } finally {
      setSavingLimit(false);
    }
  }

  if (!student) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl text-right font-sans" dir="rtl">
          <DialogHeader className="text-right sm:text-right border-b border-brand-border pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-brand-primary" />
                  إدارة أجهزة الطالب: {student.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {student.email} • {student.grade || 'طالب'}
                </p>
              </div>
              <span className="rounded-full bg-brand-chip px-3 py-1 text-xs font-bold text-brand-primary">
                {activeCount} / {maxDevices} أجهزة مسجلة
              </span>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-brand-chip animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {/* Registered Devices List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-brand-text">الأجهزة النشطة حالياً</h3>
                  {devices.length > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setResetConfirmOpen(true)}
                      className="text-xs h-8 flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      إعادة تعيين الكل
                    </Button>
                  )}
                </div>

                {devices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-brand-border p-6 text-center text-muted-foreground">
                    <Smartphone className="h-8 w-8 mx-auto opacity-40 mb-2" />
                    <p className="text-sm">لا توجد أجهزة مسجلة لهذا الطالب حتى الآن.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      سيتم تسجيل جهازه تلقائياً عند أول تسجيل دخول.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border rounded-xl border border-brand-border bg-brand-bg overflow-hidden">
                    {devices.map((device) => (
                      <div
                        key={device.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-brand-surface/60 transition"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-brand-surface border border-brand-border shrink-0 mt-0.5">
                            {getDeviceIcon(device.deviceType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-brand-text truncate">
                              {device.deviceName || 'جهاز غير معروف'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {device.browser && <span>المتصفح: {device.browser}</span>}
                              {device.os && <span>• النظام: {device.os}</span>}
                              {device.ipAddress && (
                                <span dir="ltr" className="text-[11px] font-mono">
                                  • IP: {device.ipAddress}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              آخر نشاط: {formatDate(device.lastActiveAt)}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUnbindingDevice(device)}
                          className="text-destructive hover:bg-destructive/10 text-xs shrink-0 self-end sm:self-center h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5 ml-1" />
                          إلغاء الربط
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Device Limit Configuration */}
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                <form onSubmit={handleSaveLimit} className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full space-y-1.5">
                    <Label htmlFor="customLimit" className="text-xs font-bold text-brand-text">
                      تخصيص الحد الأقصى للأجهزة لهذا الطالب
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      القيمة الافتراضية للمنصة هي ٣ أجهزة. يمكنك زيادتها أو تقليلها لهذا الطالب تحديداً.
                    </p>
                    <Input
                      id="customLimit"
                      type="number"
                      min={1}
                      max={20}
                      value={customLimit}
                      onChange={(e) => setCustomLimit(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingLimit}
                    size="sm"
                    className="w-full sm:w-auto h-9 text-xs flex items-center gap-1.5 font-bold"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingLimit ? 'جاري الحفظ...' : 'حفظ الحد'}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Unbind Dialog */}
      <ConfirmDialog
        open={Boolean(unbindingDevice)}
        onOpenChange={(open) => !open && setUnbindingDevice(null)}
        title="تأكيد إلغاء ربط الجهاز"
        description={`هل أنت متأكد من إلغاء ربط الجهاز "${unbindingDevice?.deviceName || 'المحدد'}"؟ سيتم إنهاء جلسته فوراً والسماح له بتسجيل جهاز بديل.`}
        confirmLabel="إلغاء الربط"
        busy={unbindBusy}
        variant="brand"
        onConfirm={handleUnbindConfirm}
      />

      {/* Confirm Reset All Dialog */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="تأكيد إعادة تعيين جميع الأجهزة"
        description="هل أنت متأكد من إلغاء ربط جميع الأجهزة المسجلة لهذا الطالب؟ سيتم تسجيل خروجه من جميع المتصفحات والهواتف فوراً."
        confirmLabel="إعادة تعيين الكل"
        busy={resetBusy}
        variant="brand"
        onConfirm={handleResetAllConfirm}
      />
    </>
  );
}
