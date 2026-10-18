import {
  CONSENT_STORAGE_KEY,
  ConsentChoice,
  applyConsent,
  ensureConsentDefaults,
  gaScriptUrl,
  getAnalyticsIds,
  gtmScriptUrl,
  hasAnalyticsIds,
  primeAnalytics,
  readGtagCall,
  readStoredConsent,
  shouldLoadAnalytics,
  storeConsent,
} from './consent';

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get: (key: string) => map.get(key) ?? null,
    set: (key: string, value: string) => void map.set(key, value),
  };
}

function consentCalls(dataLayer: unknown[]) {
  return dataLayer
    .map(readGtagCall)
    .filter((call): call is unknown[] => Array.isArray(call) && call[0] === 'consent');
}

describe('analytics IDs', () => {
  it('has no IDs when the env values are empty', () => {
    const ids = getAnalyticsIds({ gtmId: '', gaId: '' });
    expect(ids).toEqual({ gtmId: null, gaId: null });
    expect(hasAnalyticsIds(ids)).toBeFalse();
  });

  it('accepts well-formed IDs and ignores malformed ones', () => {
    expect(getAnalyticsIds({ gtmId: ' GTM-ABC123 ', gaId: 'G-XYZ789' })).toEqual({
      gtmId: 'GTM-ABC123',
      gaId: 'G-XYZ789',
    });
    expect(getAnalyticsIds({ gtmId: '<script>', gaId: 'UA-1' })).toEqual({ gtmId: null, gaId: null });
  });

  it('builds the Google script URLs', () => {
    expect(gtmScriptUrl('GTM-ABC123')).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-ABC123');
    expect(gaScriptUrl('G-XYZ789')).toBe('https://www.googletagmanager.com/gtag/js?id=G-XYZ789');
  });
});

describe('stored choice', () => {
  it('returns null when nothing is stored or the value is unknown', () => {
    expect(readStoredConsent(memoryStorage())).toBeNull();
    expect(readStoredConsent(memoryStorage({ [CONSENT_STORAGE_KEY]: 'maybe' }))).toBeNull();
    expect(readStoredConsent(null)).toBeNull();
  });

  it('round-trips the visitor choice', () => {
    const storage = memoryStorage();
    storeConsent(storage, 'granted');
    expect(readStoredConsent(storage)).toBe('granted');
    storeConsent(storage, 'denied');
    expect(readStoredConsent(storage)).toBe('denied');
  });

  it('survives a storage that throws', () => {
    const broken = {
      get: (): string | null => {
        throw new Error('blocked');
      },
      set: (): void => {
        throw new Error('blocked');
      },
    };
    expect(() => storeConsent(broken, 'granted')).not.toThrow();
    expect(readStoredConsent(broken)).toBeNull();
  });
});

describe('consent mode', () => {
  it('pushes denied defaults once', () => {
    const win: { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } = {};
    ensureConsentDefaults(win);
    ensureConsentDefaults(win);
    const calls = consentCalls(win.dataLayer ?? []);
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      },
    ]);
  });

  it('sends a consent update after the defaults', () => {
    const win: { dataLayer?: unknown[] } = {};
    applyConsent(win, 'granted');
    const calls = consentCalls(win.dataLayer ?? []);
    expect(calls.map((call) => call[1])).toEqual(['default', 'update']);
    expect(calls[1][2]).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
  });

  it('primes GTM and gtag before their scripts load', () => {
    const win: { dataLayer?: unknown[] } = {};
    primeAnalytics(win, { gtmId: 'GTM-ABC123', gaId: 'G-XYZ789' });
    primeAnalytics(win, { gtmId: 'GTM-ABC123', gaId: 'G-XYZ789' });
    const layer = win.dataLayer ?? [];
    expect(layer.filter((entry) => (entry as { event?: string }).event === 'gtm.js').length).toBe(1);
    const configs = layer.map(readGtagCall).filter((call) => call?.[0] === 'config');
    expect(configs.length).toBe(1);
    expect(configs[0]?.[1]).toBe('G-XYZ789');
  });
});

describe('shouldLoadAnalytics', () => {
  const ids = { gtmId: 'GTM-ABC123', gaId: null };

  it('never loads without an ID, even after accepting', () => {
    expect(shouldLoadAnalytics('granted', { gtmId: null, gaId: null })).toBeFalse();
  });

  it('never loads without an explicit accept', () => {
    const none: ConsentChoice | null = null;
    expect(shouldLoadAnalytics(none, ids)).toBeFalse();
    expect(shouldLoadAnalytics('denied', ids)).toBeFalse();
  });

  it('loads once accepted and configured', () => {
    expect(shouldLoadAnalytics('granted', ids)).toBeTrue();
  });
});
