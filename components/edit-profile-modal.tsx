'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { setCachedUser } from '@/lib/user-cache';
import { addNotification } from '@/store/slices/uiSlice';
import { updateMyProfile } from '@/services/userService';
import type { User } from '@/types/api';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text outline-none transition placeholder:text-brand-muted focus:border-brand-primary';

export function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave() {
    setFormError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setFormError('الاسم يجب أن يكون حرفين على الأقل');
      return;
    }

    const wantsPasswordChange = newPassword.length > 0 || confirmPassword.length > 0 || currentPassword.length > 0;
    if (wantsPasswordChange) {
      if (!currentPassword) {
        setFormError('أدخل كلمة المرور الحالية لتغيير كلمة المرور');
        return;
      }
      if (newPassword.length < 8) {
        setFormError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
        return;
      }
      if (newPassword !== confirmPassword) {
        setFormError('كلمتا المرور الجديدتان غير متطابقتين');
        return;
      }
    }

    setSaving(true);
    try {
      const body: { name?: string; password?: string; currentPassword?: string } = {};
      if (trimmedName !== user.name) body.name = trimmedName;
      if (wantsPasswordChange) {
        body.password = newPassword;
        body.currentPassword = currentPassword;
      }
      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }
      const updated = await updateMyProfile(user.slug, body);
      dispatch(loginSuccess(updated));
      setCachedUser(updated);
      dispatch(addNotification({ type: 'success', message: 'تم حفظ التعديلات بنجاح', duration: 3000 }));
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'تعذر حفظ التعديلات، حاول مرة أخرى');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-brand-surface p-6">
        <p className="text-base font-bold text-brand-text">تعديل الملف الشخصي</p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-name" className="mb-1.5 block text-sm font-semibold text-brand-text">الاسم الكامل</label>
            <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="rounded-xl bg-brand-bg p-4">
            <p className="mb-3 text-xs font-bold text-brand-muted">تغيير كلمة المرور (اختياري)</p>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="كلمة المرور الحالية"
                aria-label="كلمة المرور الحالية"
                className={inputClass}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                aria-label="كلمة المرور الجديدة"
                className={inputClass}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور الجديدة"
                aria-label="تأكيد كلمة المرور الجديدة"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {formError && (
          <p role="alert" className="mt-3 text-center text-sm font-semibold text-brand-accent">{formError}</p>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-brand-border py-2.5 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-hover"
          >
            تراجع
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-full bg-brand-primary py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </div>
    </div>
  );
}
