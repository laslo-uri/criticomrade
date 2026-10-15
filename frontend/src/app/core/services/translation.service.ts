import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { storage } from '../utils/storage';

export type Locale = 'en' | 'sr' | 'hu' | 'de';

export const LOCALES: { code: Locale; label: string; intl: string }[] = [
  { code: 'en', label: 'English', intl: 'en-GB' },
  { code: 'sr', label: 'Srpski', intl: 'sr-Latn-RS' },
  { code: 'hu', label: 'Magyar', intl: 'hu-HU' },
  { code: 'de', label: 'Deutsch', intl: 'de-DE' },
];

const STORAGE_KEY = 'criticomrade_locale';

type TranslationDict = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);

  readonly locale = signal<Locale>(this.readInitial());
  private readonly dictionary = signal<TranslationDict>({});
  /** English is always loaded so missing keys never show raw ids. */
  private fallback: TranslationDict = {};

  get intlLocale(): string {
    return LOCALES.find((l) => l.code === this.locale())?.intl ?? 'en-GB';
  }

  async init(): Promise<void> {
    this.fallback = await this.fetch('en');
    await this.loadLocale(this.locale());
  }

  async setLocale(locale: Locale): Promise<void> {
    await this.loadLocale(locale);
    storage.set(STORAGE_KEY, locale);
  }

  /**
   * Looks up a key. When params include a numeric `count`, a plural form such as
   * `key_one` / `key_few` (Intl.PluralRules categories) is preferred if it exists.
   */
  translate(key: string, params?: Record<string, string | number>): string {
    let value: string | undefined;
    const count = params?.['count'];
    if (typeof count === 'number') {
      const rule = new Intl.PluralRules(this.intlLocale).select(count);
      value = this.lookup(this.dictionary(), `${key}_${rule}`);
      if (value === undefined && this.locale() === 'en') value = this.lookup(this.fallback, `${key}_${rule}`);
    }
    value ??= this.lookup(this.dictionary(), key) ?? this.lookup(this.fallback, key) ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }
    return value;
  }

  private async loadLocale(locale: Locale): Promise<void> {
    const data = locale === 'en' && Object.keys(this.fallback).length ? this.fallback : await this.fetch(locale);
    this.dictionary.set(data);
    this.locale.set(locale);
    document.documentElement.lang = locale;
  }

  private async fetch(locale: Locale): Promise<TranslationDict> {
    try {
      return await firstValueFrom(this.http.get<TranslationDict>(`i18n/${locale}.json`));
    } catch {
      return {};
    }
  }

  private lookup(dict: TranslationDict, key: string): string | undefined {
    let node: unknown = dict;
    for (const part of key.split('.')) {
      if (!node || typeof node !== 'object') return undefined;
      node = (node as TranslationDict)[part];
    }
    return typeof node === 'string' ? node : undefined;
  }

  private readInitial(): Locale {
    const stored = storage.get(STORAGE_KEY) as Locale | null;
    if (stored && LOCALES.some((l) => l.code === stored)) return stored;
    const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return (LOCALES.find((l) => l.code === browser)?.code ?? 'en') as Locale;
  }
}
