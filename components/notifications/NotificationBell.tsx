"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated, selectUser } from "@/store/slices/authSlice";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";
import type { NotificationItem } from "@/types/notifications";

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

/**
 * Student notification bell + dropdown. Renders nothing unless the backend
 * says the module is enabled (features come from /user/me — never decided
 * client-side). Badge fetched on mount; list refreshes on open.
 */
export default function NotificationBell() {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const enabled = user?.features?.notifications !== false;

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      setUnread(await getUnreadCount());
    } catch {
      // Badge is best-effort; the list view surfaces real errors.
    }
  }, []);

  const refreshList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNotifications({ limit: 15 });
      setItems(data.items);
      const count = await getUnreadCount();
      setUnread(count);
    } catch {
      setError("تعذر تحميل الإشعارات.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && enabled) void refreshCount();
  }, [isAuthenticated, enabled, refreshCount]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open ]);

  useEffect(() => {
    if (open && isAuthenticated && enabled) void refreshList();
  }, [open, isAuthenticated, enabled, refreshList]);

  if (!isAuthenticated || !enabled) return null;

  const openItem = async (item: NotificationItem) => {
    setOpen(false);
    if (!item.read) {
      try {
        await markNotificationRead(item.id);
        setUnread((u) => Math.max(0, u - 1));
        setItems((list) => list.map((x) => (x.id === item.id ? { ...x, read: true } : x)));
      } catch {
        // Navigation still proceeds; read state syncs on next open.
      }
    }
    if (item.linkUrl) router.push(item.linkUrl);
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setItems((list) => list.map((x) => ({ ...x, read: true })));
    } catch {
      setError("تعذر تحديد الكل كمقروء.");
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        aria-label="الإشعارات"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full border-2 border-primary-light/60 text-primary-light hover:bg-primary-color/8 transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-primary-color/30"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-level-3 py-2 z-50 border border-outline-variant animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/60">
            <p className="text-sm font-bold text-on-surface">الإشعارات</p>
            <button
              onClick={() => void markAll()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0057c0] hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              تحديد الكل كمقروء
            </button>
          </div>
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-on-surface-variant">جاري التحميل...</p>
          ) : error ? (
            <p role="alert" className="px-4 py-6 text-center text-sm text-red-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-on-surface-variant">لا توجد إشعارات بعد.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => void openItem(item)}
                    className={`w-full text-right px-4 py-2.5 hover:bg-surface-container-low transition-colors ${item.read ? "" : "bg-[#e8f2ff]/50"}`}
                  >
                    <p className="text-sm font-bold text-on-surface leading-5">{item.title}</p>
                    {item.body && <p className="mt-0.5 text-xs text-on-surface-variant leading-5 line-clamp-2">{item.body}</p>}
                    <p className="mt-1 text-[11px] text-on-surface-variant/70">{timeAgo(item.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
