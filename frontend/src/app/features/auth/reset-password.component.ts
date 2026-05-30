import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, LogoComponent, PasswordFieldComponent],
  template: `
    <div class="auth-page">
      <div class="auth-page-inner">
        <app-logo variant="hero" />

        <div class="auth-form">
          <h1 class="auth-title">{{ 'auth.resetPassword.title' | translate }}</h1>
          <p class="auth-subtitle">{{ 'auth.resetPassword.subtitle' | translate }}</p>

          <form class="auth-fields" (ngSubmit)="submit()">
            <div>
              <label class="auth-label">{{ 'auth.resetPassword.email' | translate }}</label>
              <input
                type="email"
                class="input-field"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
              />
            </div>
            <div>
              <label class="auth-label">{{ 'auth.resetPassword.code' | translate }}</label>
              <input
                type="text"
                class="input-field tracking-widest"
                [(ngModel)]="code"
                name="code"
                required
                maxlength="6"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="one-time-code"
                placeholder="000000"
              />
            </div>
            <div>
              <label class="auth-label">{{ 'auth.resetPassword.newPassword' | translate }}</label>
              <app-password-field
                [(ngModel)]="newPassword"
                name="newPassword"
                autocomplete="new-password"
                [required]="true"
              />
            </div>
            <div>
              <label class="auth-label">{{ 'auth.resetPassword.confirmPassword' | translate }}</label>
              <app-password-field
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                autocomplete="new-password"
                [required]="true"
              />
            </div>
            <button type="submit" class="btn-primary w-full !py-3" [disabled]="loading()">
              {{
                (loading() ? 'auth.resetPassword.submitting' : 'auth.resetPassword.submit')
                  | translate
              }}
            </button>
          </form>

          <p class="auth-footer">
            {{ 'auth.resetPassword.resendPrompt' | translate }}
            <a
              [routerLink]="['/auth/forgot-password']"
              [queryParams]="{ email: email }"
              class="text-accent hover:underline"
            >
              {{ 'auth.resetPassword.resendLink' | translate }}
            </a>
          </p>
          <p class="auth-footer">
            <a routerLink="/auth/login" class="text-accent hover:underline">
              {{ 'auth.resetPassword.backToLogin' | translate }}
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly translationService = inject(TranslationService);

  email = '';
  code = '';
  newPassword = '';
  confirmPassword = '';
  loading = signal(false);

  ngOnInit(): void {
    const preset = this.route.snapshot.queryParamMap.get('email');
    if (preset) {
      this.email = preset;
    }
  }

  submit(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.toast.error(this.translationService.translate('auth.resetPassword.passwordMismatch'));
      return;
    }

    if (!/^\d{6}$/.test(this.code.trim())) {
      this.toast.error(this.translationService.translate('auth.resetPassword.invalidCode'));
      return;
    }

    this.loading.set(true);
    this.auth
      .resetPassword(this.email.trim(), this.code.trim(), this.newPassword)
      .subscribe({
        next: () => {
          this.toast.success(this.translationService.translate('auth.resetPassword.success'));
          this.router.navigate(['/auth/login']);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error(this.translationService.translate('auth.resetPassword.failed'));
          this.loading.set(false);
        },
      });
  }
}
