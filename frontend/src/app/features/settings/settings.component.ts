import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideLogOut, LucideMoon, LucideRotateCcw, LucideSun } from '@lucide/angular';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { RuntimeService } from '../../core/services/runtime.service';
import { DemoService } from '../../core/demo/demo.interceptor';
import { TranslationService, LOCALES, Locale } from '../../core/services/translation.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { errorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, TranslatePipe, LucideMoon, LucideSun, LucideLogOut, LucideRotateCcw, AvatarComponent],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'settings.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'settings.subtitle' | translate }}</p>
      </div>
    </header>

    <div class="max-w-2xl space-y-12">
      <section aria-labelledby="s-profile">
        <h2 id="s-profile" class="section-title mb-5">{{ 'settings.profileTitle' | translate }}</h2>
        <form class="space-y-5" [formGroup]="form" (ngSubmit)="save()">
          <div class="flex items-center gap-4">
            <app-avatar [name]="auth.currentUser()?.username" [url]="form.controls.avatarUrl.value" [size]="64" />
            <label class="block flex-1">
              <span class="field-label">{{ 'settings.avatarUrl' | translate }}</span>
              <input type="url" class="input-field" formControlName="avatarUrl" placeholder="https://" />
            </label>
          </div>
          <label class="block">
            <span class="field-label">{{ 'settings.fullName' | translate }}</span>
            <input type="text" class="input-field" formControlName="fullName" autocomplete="name" maxlength="80" />
          </label>
          <label class="block">
            <span class="field-label">{{ 'settings.bio' | translate }}</span>
            <textarea class="input-field min-h-24" rows="3" formControlName="bio" maxlength="280"></textarea>
            <span class="field-hint block text-right tabular-nums">{{ form.controls.bio.value.length }} / 280</span>
          </label>
          <label class="flex cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" class="mt-0.5 h-4 w-4" formControlName="profilePublic" />
            <span>
              <span class="block font-semibold">{{ 'settings.publicProfile' | translate }}</span>
              <span class="block text-muted">{{ 'settings.publicProfileHint' | translate }}</span>
            </span>
          </label>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || form.pristine || saving()">
            {{ (saving() ? 'settings.saving' : 'settings.save') | translate }}
          </button>
        </form>
      </section>

      <section aria-labelledby="s-look">
        <h2 id="s-look" class="section-title mb-5">{{ 'settings.appearanceTitle' | translate }}</h2>
        <div class="grid grid-cols-2 gap-3" role="radiogroup" [attr.aria-label]="'settings.theme' | translate">
          @for (option of themes; track option.id) {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="theme.theme() === option.id"
              class="flex items-center gap-3 rounded-panel border p-4 text-left transition"
              [class]="theme.theme() === option.id ? 'border-accent bg-accent/10' : 'border-border hover:border-text/30'"
              (click)="setTheme(option.id)"
            >
              @if (option.id === 'dark') { <svg lucideMoon [size]="20" /> } @else { <svg lucideSun [size]="20" /> }
              <span class="font-semibold">{{ option.labelKey | translate }}</span>
            </button>
          }
        </div>
      </section>

      <section aria-labelledby="s-lang">
        <h2 id="s-lang" class="section-title mb-5">{{ 'settings.languageTitle' | translate }}</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" [attr.aria-label]="'settings.language' | translate">
          @for (loc of locales; track loc.code) {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="i18n.locale() === loc.code"
              [attr.lang]="loc.code"
              class="rounded-panel border px-4 py-3 text-left font-semibold transition"
              [class]="i18n.locale() === loc.code ? 'border-accent bg-accent/10' : 'border-border hover:border-text/30'"
              (click)="setLocale(loc.code)"
            >
              {{ loc.label }}
            </button>
          }
        </div>
      </section>

      @if (runtime.demo()) {
        <section aria-labelledby="s-demo" class="rounded-panel border border-brass/40 bg-brass/5 p-5">
          <h2 id="s-demo" class="section-title">{{ 'settings.demoTitle' | translate }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-muted">{{ 'settings.demoText' | translate }}</p>
          @if (confirmReset()) {
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <span class="text-sm">{{ 'settings.demoConfirm' | translate }}</span>
              <button type="button" class="btn btn-sm !bg-danger/15 !text-danger" (click)="resetDemo()">{{ 'settings.demoReset' | translate }}</button>
              <button type="button" class="btn-ghost btn-sm" (click)="confirmReset.set(false)">{{ 'common.cancel' | translate }}</button>
            </div>
          } @else {
            <button type="button" class="btn-secondary btn-sm mt-4" (click)="confirmReset.set(true)"><svg lucideRotateCcw [size]="15" /> {{ 'settings.demoReset' | translate }}</button>
          }
        </section>
      }

      <section aria-labelledby="s-account" class="border-t border-border/70 pt-8">
        <h2 id="s-account" class="sr-only">{{ 'settings.account' | translate }}</h2>
        <p class="text-sm text-muted">{{ 'settings.signedInAs' | translate: { username: auth.currentUser()?.username ?? '' } }}</p>
        <button type="button" class="btn-secondary mt-3" (click)="logout()"><svg lucideLogOut [size]="17" /> {{ 'nav.logOut' | translate }}</button>
      </section>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly users = inject(UserService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly demo = inject(DemoService);
  readonly theme = inject(ThemeService);
  readonly i18n = inject(TranslationService);
  readonly runtime = inject(RuntimeService);
  readonly locales = LOCALES;
  readonly themes: { id: Theme; labelKey: string }[] = [
    { id: 'dark', labelKey: 'settings.themeDark' },
    { id: 'light', labelKey: 'settings.themeLight' },
  ];

  readonly saving = signal(false);
  readonly confirmReset = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: [''],
    bio: ['', Validators.maxLength(280)],
    avatarUrl: ['', Validators.pattern(/^(https?:\/\/\S+)?$/)],
    profilePublic: [true],
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form.reset({
        fullName: user.fullName ?? '',
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
        profilePublic: user.profilePublic ?? true,
      });
    }
  }

  setTheme(theme: Theme): void {
    this.theme.setTheme(theme);
  }

  setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.users.updateProfile(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.auth.updateCurrentUser({ ...this.auth.currentUser()!, ...user });
        this.form.markAsPristine();
        this.toast.success(this.i18n.translate('settings.updated'));
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, this.i18n.translate('settings.saveFailed')));
        this.saving.set(false);
      },
    });
  }

  resetDemo(): void {
    this.demo.reset();
    this.auth.logout();
    this.toast.success(this.i18n.translate('settings.demoDone'));
    this.router.navigateByUrl('/', { onSameUrlNavigation: 'reload' });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/', { onSameUrlNavigation: 'reload' });
  }
}
