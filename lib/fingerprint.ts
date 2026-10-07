const STORAGE_KEY = 'elrn_device_id';

let cachedVisitorId: string | null = null;
let fpPromise: Promise<string> | null = null;

export function getCachedDeviceId(): string {
  if (typeof window === 'undefined') return '';
  if (cachedVisitorId) return cachedVisitorId;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedVisitorId = stored;
      return stored;
    }
  } catch {
    // localStorage restricted / private mode
  }
  return '';
}

export async function prewarmFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';
  if (cachedVisitorId) return cachedVisitorId;
  if (fpPromise) return fpPromise;

  fpPromise = (async () => {
    try {
      // Dynamic import to keep main bundle lean (0 KB on non-auth pages)
      const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      cachedVisitorId = result.visitorId;
      try {
        localStorage.setItem(STORAGE_KEY, result.visitorId);
      } catch {
        /* storage unavailable */
      }
      return result.visitorId;
    } catch {
      // Fallback for ad-blockers / Brave shields
      let fallback = '';
      try {
        fallback = localStorage.getItem(STORAGE_KEY) || '';
      } catch {
        /* ignore */
      }

      if (!fallback) {
        fallback =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        try {
          localStorage.setItem(STORAGE_KEY, fallback);
        } catch {
          /* ignore */
        }
      }
      cachedVisitorId = fallback;
      return fallback;
    }
  })();

  return fpPromise;
}

export async function getDevicePayload(): Promise<{ id: string }> {
  const id = await prewarmFingerprint();
  return { id };
}
