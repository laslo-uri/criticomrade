import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { RuntimeService } from '../../core/services/runtime.service';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { errorMessage } from '../../core/utils/http-error';
import { DEMO_RESET_CODE } from '../../core/demo/demo-seed';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink, TranslatePipe, PasswordFieldComponent],
  template: `
    <h1 class="page-title">{{ 'auth.resetPassword.title' | translate }}</h1>
    <p class="page-subtitle">{{ 'auth.resetPassword.subtitle' | translate }}</p>
    @if (runtime.demo()) {
      <p class="mt-5 rounded-lg border border-brass/40 bg-brass/10 px-3.5 py-2.5 text-sm">{{ 'auth.resetPassword.demoHint' | translate: { code: demoCode } }}</p>
    }
    <form class="mt-7 space-y-4" (ngSubmit)="submit()" #f="ngForm">
      <label class="block">
        <span class="field-label">{{ 'auth.resetPassword.email' | translate }}</span>
        <input type="email" class="input-field" [(ngModel)]="email" name="email" required email autocomplete="email" />
      </label>
      <label class="block">
        <span class="field-label">{{ 'auth.resetPassword.code' | translate }}</span>
        <input
          type="text"
          class="input-field font-display text-xl tracking-[0.4em]"
          [(ngModel)]="code"
          name="code"
          required
          maxlength="6"
          inputmode="numeric"
          pattern="[0-9]{6}"
          autocomplete="one-time-code"
          placeholder="000000"
        />
      </label>
      <div>
        <label for="new-password" class="field-label">{{ 'auth.resetPassword.newPassword' | translate }}</label>
        <app-password-field inputId="new-password" [(ngModel)]="newPassword" name="newPassword" autocomplete="new-password" [required]="true" [minlength]="8" />
        <span class="field-hint block">{{ 'auth.register.passwordHint' | translate }}</span>
      </div>
      <div>
        <label for="confirm-password" class="field-label">{{ 'auth.resetPassword.confirmPassword' | translate }}</label>
        <app-password-field inputId="confirm-password" [(ngModel)]="confirmPassword" name="confirmPassword" autocomplete="new-password" [required]="true" />
      </div>
      @if (error()) {
        <p class="text-sm font-medium text-danger" role="alert">{{ error() }}</p>
      }
      <button type="submit" class="btn-primary w-full" [disabled]="loading() || !f.valid">
        {{ (loading() ? 'auth.resetPassword.submitting' : 'auth.resetPassword.submit') | translate }}
      </button>
    </form>
    <p class="mt-8 text-sm text-muted">
      {{ 'auth.resetPassword.resendPrompt' | translate }}
      <a [routerLink]="['/auth/forgot-password']" [queryParams]="{ email: email }" class="link-quiet">{{ 'auth.resetPassword.resendLink' | translate }}</a>
    </p>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  readonly runtime = inject(RuntimeService);
  readonly demoCode = DEMO_RESET_CODE;

  email = '';
  code = '';
  newPassword = '';
  confirmPassword = '';
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }

  submit(): void {
    this.error.set('');
    if (this.newPassword.length < 8) {
      this.error.set(this.i18n.translate('auth.register.passwordHint'));
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set(this.i18n.translate('auth.resetPassword.passwordMismatch'));
      return;
    }
    if (!/^\d{6}$/.test(this.code.trim())) {
      this.error.set(this.i18n.translate('auth.resetPassword.invalidCode'));
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.email.trim(), this.code.trim(), this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success(this.i18n.translate('auth.resetPassword.success'));
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err, this.i18n.translate('auth.resetPassword.failed')));
      },
    });
  }
}
