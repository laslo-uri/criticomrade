import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Locale = 'en' | 'sr' | 'hu' | 'de';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sr', label: 'Srpski' },
  { code: 'hu', label: 'Magyar' },
  { code: 'de', label: 'Deutsch' },
];

const STORAGE_KEY = 'criticomrade_locale';

type TranslationDict = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);

  readonly locale = signal<Locale>(this.readStored());
  private readonly dictionary = signal<TranslationDict>({});

  async init(): Promise<void> {
    await this.loadLocale(this.locale());
  }

  async setLocale(locale: Locale): Promise<void> {
    if (locale === this.locale() && Object.keys(this.dictionary()).length) {
      return;
    }
    await this.loadLocale(locale);
    this.locale.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }

  translate(key: string, params?: Record<string, string | number>): string {
    let value = this.lookup(key) ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }
    return value;
  }

  private async loadLocale(locale: Locale): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<TranslationDict>(`/i18n/${locale}.json`)
    );
    this.dictionary.set(data);
    this.locale.set(locale);
    document.documentElement.lang = locale;
  }

  private lookup(key: string): string | undefined {
    const parts = key.split('.');
    let node: unknown = this.dictionary();
    for (const part of parts) {
      if (!node || typeof node !== 'object') {
        return undefined;
      }
      node = (node as TranslationDict)[part];
    }
    return typeof node === 'string' ? node : undefined;
  }

  private readStored(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return stored && LOCALES.some((l) => l.code === stored) ? stored : 'en';
  }
}
