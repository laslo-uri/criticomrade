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
    selector: 'app-forgot-password',
    imports: [FormsModule, RouterLink, TranslatePipe, LogoComponent],
    template: `
    <div class="auth-page">
      <div class="auth-page-inner">
        <app-logo variant="hero" />

        <div class="auth-form">
          <h1 class="auth-title">{{ 'auth.forgotPassword.title' | translate }}</h1>
          <p class="auth-subtitle">{{ 'auth.forgotPassword.subtitle' | translate }}</p>

          <form class="auth-fields" (ngSubmit)="submit()">
            <div>
              <label class="auth-label">{{ 'auth.forgotPassword.email' | translate }}</label>
              <input
                type="email"
                class="input-field"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
              />
            </div>
            <button type="submit" class="btn-primary w-full !py-3" [disabled]="loading()">
              {{
                (loading() ? 'auth.forgotPassword.submitting' : 'auth.forgotPassword.submit')
                  | translate
              }}
            </button>
          </form>

          <p class="auth-footer">
            <a routerLink="/auth/login" class="text-accent hover:underline">
              {{ 'auth.forgotPassword.backToLogin' | translate }}
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly translationService = inject(TranslationService);

  email = '';
  loading = signal(false);

  ngOnInit(): void {
    const preset = this.route.snapshot.queryParamMap.get('email');
    if (preset) {
      this.email = preset;
    }
  }

  submit(): void {
    this.loading.set(true);
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.toast.success(this.translationService.translate('auth.forgotPassword.sent'));
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { email: this.email.trim() },
        });
        this.loading.set(false);
      },
      error: () => {
        this.toast.error(this.translationService.translate('auth.forgotPassword.failed'));
        this.loading.set(false);
      },
    });
  }
}
