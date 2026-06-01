import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { LucideMoon, LucideSun } from '@lucide/angular';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService, Theme } from '../../core/services/theme.service';
import {
  TranslationService,
  LOCALES,
  Locale,
} from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
    selector: 'app-settings',
    imports: [ReactiveFormsModule, TranslatePipe, LucideMoon, LucideSun],
    template: `
    <div class="mx-auto max-w-lg space-y-8">
      <header class="page-header !mb-0">
        <h1 class="page-title">{{ 'settings.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'settings.subtitle' | translate }}</p>
      </header>

      <section class="card space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-muted">
          {{ 'settings.appearanceTitle' | translate }}
        </h2>
        <div>
          <label class="mb-2 block text-sm text-muted">{{ 'settings.theme' | translate }}</label>
          <div class="theme-toggle">
            <button
              type="button"
              class="theme-option"
              [class.theme-option-active]="themeService.theme() === 'dark'"
              (click)="setTheme('dark')"
            >
              <svg lucideMoon [size]="18" />
              {{ 'settings.themeDark' | translate }}
            </button>
            <button
              type="button"
              class="theme-option"
              [class.theme-option-active]="themeService.theme() === 'light'"
              (click)="setTheme('light')"
            >
              <svg lucideSun [size]="18" />
              {{ 'settings.themeLight' | translate }}
            </button>
          </div>
        </div>
      </section>

      <section class="card space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-muted">
          {{ 'settings.languageTitle' | translate }}
        </h2>
        <div>
          <label class="mb-1 block text-sm text-muted">{{ 'settings.language' | translate }}</label>
          <select
            class="input-field"
            [value]="translationService.locale()"
            (change)="onLocaleChange($event)"
          >
            @for (loc of locales; track loc.code) {
              <option [value]="loc.code">{{ loc.label }}</option>
            }
          </select>
        </div>
      </section>

      <section class="card space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-muted">
          {{ 'settings.profileTitle' | translate }}
        </h2>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
          <div>
            <label class="mb-1 block text-sm text-muted">{{ 'settings.fullName' | translate }}</label>
            <input type="text" class="input-field" formControlName="fullName" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-muted">{{ 'settings.bio' | translate }}</label>
            <textarea class="input-field min-h-[80px]" rows="3" formControlName="bio"></textarea>
          </div>
          <div>
            <label class="mb-1 block text-sm text-muted">{{ 'settings.avatarUrl' | translate }}</label>
            <input type="url" class="input-field" formControlName="avatarUrl" />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" formControlName="profilePublic" />
            {{ 'settings.publicProfile' | translate }}
          </label>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
            {{ (saving() ? 'settings.saving' : 'settings.save') | translate }}
          </button>
        </form>
      </section>
    </div>
  `
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly themeService = inject(ThemeService);
  readonly translationService = inject(TranslationService);
  readonly locales = LOCALES;

  saving = signal(false);

  form = this.fb.nonNullable.group({
    fullName: [''],
    bio: [''],
    avatarUrl: [''],
    profilePublic: [true],
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        fullName: user.fullName ?? '',
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
        profilePublic: user.profilePublic ?? true,
      });
    }
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  async onLocaleChange(event: Event): Promise<void> {
    const locale = (event.target as HTMLSelectElement).value as Locale;
    await this.translationService.setLocale(locale);
    localStorage.setItem('criticomrade_locale', locale);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.userService.updateProfile(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.toast.success(this.translationService.translate('settings.updated'));
        this.saving.set(false);
      },
      error: () => {
        this.toast.error(this.translationService.translate('settings.saveFailed'));
        this.saving.set(false);
      },
    });
  }
}
