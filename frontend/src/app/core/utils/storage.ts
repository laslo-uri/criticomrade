/**
 * Storage access that never throws (private mode, blocked cookies, SSR-like contexts).
 */
function safe(kind: 'local' | 'session'): Storage | null {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = '__cc_probe__';
    store.setItem(probe, probe);
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

const memory = new Map<string, string>();

export const storage = {
  get(key: string, kind: 'local' | 'session' = 'local'): string | null {
    const store = safe(kind);
    return store ? store.getItem(key) : memory.get(`${kind}:${key}`) ?? null;
  },
  set(key: string, value: string, kind: 'local' | 'session' = 'local'): void {
    const store = safe(kind);
    if (store) {
      try {
        store.setItem(key, value);
        return;
      } catch {
        /* quota exceeded — fall through to memory */
      }
    }
    memory.set(`${kind}:${key}`, value);
  },
  remove(key: string, kind: 'local' | 'session' = 'local'): void {
    safe(kind)?.removeItem(key);
    memory.delete(`${kind}:${key}`);
  },
  getJson<T>(key: string, kind: 'local' | 'session' = 'local'): T | null {
    const raw = storage.get(key, kind);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJson(key: string, value: unknown, kind: 'local' | 'session' = 'local'): void {
    storage.set(key, JSON.stringify(value), kind);
  },
};
