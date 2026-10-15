import { Injectable, signal } from '@angular/core';
import { storage } from '../utils/storage';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'criticomrade_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readInitial());

  init(): void {
    this.apply(this.theme());
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    storage.set(STORAGE_KEY, theme);
    this.apply(theme);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#151011' : '#EFECE7');
  }

  private readInitial(): Theme {
    const stored = storage.get(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    try {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }
}
