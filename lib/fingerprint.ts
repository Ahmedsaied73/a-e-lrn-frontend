const STORAGE_KEY = 'elrn_device_id';
const COOKIE_KEY = 'elrn_device_id';

let cachedVisitorId: string | null = null;
let fpPromise: Promise<string> | null = null;

function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.trim().length >= 8 && id.trim().length <= 64;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 3650): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function readStoredId(): string | null {
  if (typeof window === 'undefined') return null;
  // 1. Try localStorage
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (isValidId(fromStorage)) return fromStorage.trim();
  } catch {
    /* storage restricted */
  }

  // 2. Try cookie fallback
  try {
    const fromCookie = getCookie(COOKIE_KEY);
    if (isValidId(fromCookie)) {
      // Sync back to localStorage
      try { localStorage.setItem(STORAGE_KEY, fromCookie.trim()); } catch {}
      return fromCookie.trim();
    }
  } catch {
    /* cookie restricted */
  }

  return null;
}

function persistId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
  try {
    setCookie(COOKIE_KEY, id);
  } catch {}
}

export function getCachedDeviceId(): string {
  if (typeof window === 'undefined') return '';
  if (cachedVisitorId) return cachedVisitorId;
  const stored = readStoredId();
  if (stored) {
    cachedVisitorId = stored;
    return stored;
  }
  return '';
}

export async function prewarmFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';

  // PRIORITY 1: If an existing ID already exists in storage or cookie, REUSE IT.
  // NEVER recalculate or overwrite an established device identity.
  const existing = readStoredId();
  if (existing) {
    cachedVisitorId = existing;
    return existing;
  }

  if (cachedVisitorId) return cachedVisitorId;
  if (fpPromise) return fpPromise;

  fpPromise = (async () => {
    let generatedId = '';

    // PRIORITY 2: First-time generation on this browser
    try {
      const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      if (isValidId(result.visitorId)) {
        generatedId = result.visitorId;
      }
    } catch {
      /* fallback below */
    }

    if (!generatedId) {
      generatedId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }

    persistId(generatedId);
    cachedVisitorId = generatedId;
    return generatedId;
  })();

  return fpPromise;
}

export async function getDevicePayload(): Promise<{ id: string }> {
  const id = await prewarmFingerprint();
  return { id };
}
