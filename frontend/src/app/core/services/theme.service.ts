import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'criticomrade_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readStored());

  init(): void {
    this.apply(this.theme());
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this.apply(theme);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private readStored(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  }
}
