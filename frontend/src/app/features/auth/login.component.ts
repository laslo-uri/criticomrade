import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RuntimeService } from '../../core/services/runtime.service';
import { TranslationService } from '../../core/services/translation.service';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { errorMessage } from '../../core/utils/http-error';
import { DEMO_PASSWORD, DEMO_USERNAME } from '../../core/demo/demo-seed';

/** Only allow in-app return paths, never full URLs. */
export function safeReturnUrl(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslatePipe, PasswordFieldComponent],
  template: `
    <h1 class="page-title">{{ 'auth.login.title' | translate }}</h1>
    <p class="page-subtitle">{{ 'auth.login.subtitle' | translate }}</p>

    @if (expired()) {
      <p class="mt-5 rounded-lg border border-brass/40 bg-brass/10 px-3.5 py-2.5 text-sm">{{ 'auth.login.expired' | translate }}</p>
    }

    @if (runtime.anyDemo()) {
      <div class="mt-6 rounded-panel border border-border bg-surface p-4">
        <p class="text-sm leading-relaxed">
          {{ 'auth.login.demoHint' | translate: { username: demoUser, password: demoPassword } }}
        </p>
        <button type="button" class="btn-brass btn-sm mt-3" (click)="useDemo()" [disabled]="loading()">{{ 'auth.login.demoButton' | translate }}</button>
      </div>
    }

    <form class="mt-6 space-y-4" (ngSubmit)="submit()" #f="ngForm">
      <label class="block">
        <span class="field-label">{{ 'auth.login.emailOrUsername' | translate }}</span>
        <input type="text" class="input-field" [(ngModel)]="username" name="username" required autocomplete="username" autocapitalize="none" spellcheck="false" />
      </label>
      <div>
        <div class="flex items-baseline justify-between">
          <label for="login-password" class="field-label">{{ 'auth.login.password' | translate }}</label>
          <a routerLink="/auth/forgot-password" class="py-1 text-[13px] font-medium text-accent-ink hover:underline">{{ 'auth.login.forgotPassword' | translate }}</a>
        </div>
        <app-password-field inputId="login-password" [(ngModel)]="password" name="password" autocomplete="current-password" [required]="true" />
      </div>
      @if (error()) {
        <p class="text-sm font-medium text-danger" role="alert">{{ error() }}</p>
      }
      <label class="flex min-h-6 cursor-pointer items-center gap-2.5 text-sm text-muted">
        <input type="checkbox" class="h-[18px] w-[18px]" [(ngModel)]="rememberMe" name="rememberMe" />
        {{ 'auth.login.rememberMe' | translate }}
      </label>
      <button type="submit" class="btn-primary w-full" [disabled]="loading() || !f.valid">
        {{ (loading() ? 'auth.login.submitting' : 'auth.login.submit') | translate }}
      </button>
    </form>

    <p class="mt-8 text-sm text-muted">
      {{ 'auth.login.noAccount' | translate }}
      <a routerLink="/auth/register" [queryParams]="returnQuery()" class="link-quiet">{{ 'auth.login.registerLink' | translate }}</a>
    </p>
  `,
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(TranslationService);
  readonly runtime = inject(RuntimeService);

  readonly demoUser = DEMO_USERNAME;
  readonly demoPassword = DEMO_PASSWORD;

  username = '';
  password = '';
  rememberMe = true;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly expired = signal(false);

  ngOnInit(): void {
    this.rememberMe = this.auth.rememberMePreference;
    this.expired.set(this.route.snapshot.queryParamMap.has('expired'));
  }

  returnQuery(): Record<string, string> | null {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url ? { returnUrl: url } : null;
  }

  useDemo(): void {
    this.username = this.demoUser;
    this.password = this.demoPassword;
    this.submit();
  }

  submit(): void {
    if (!this.username.trim() || !this.password || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth
      .login({ username: this.username.trim(), password: this.password, rememberMe: this.rememberMe })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')), { onSameUrlNavigation: 'reload' });
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(
            err?.status === 401 || err?.status === 400
              ? this.i18n.translate('auth.login.invalidCredentials')
              : errorMessage(err, this.i18n.translate('common.serverUnavailable'))
          );
        },
      });
  }
}
