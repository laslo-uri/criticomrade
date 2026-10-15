import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { errorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <h1 class="page-title">{{ 'auth.forgotPassword.title' | translate }}</h1>
    <p class="page-subtitle">{{ 'auth.forgotPassword.subtitle' | translate }}</p>
    <form class="mt-7 space-y-4" (ngSubmit)="submit()" #f="ngForm">
      <label class="block">
        <span class="field-label">{{ 'auth.forgotPassword.email' | translate }}</span>
        <input type="email" class="input-field" [(ngModel)]="email" name="email" required email autocomplete="email" />
      </label>
      @if (error()) {
        <p class="text-sm font-medium text-danger" role="alert">{{ error() }}</p>
      }
      <button type="submit" class="btn-primary w-full" [disabled]="loading() || !f.valid">
        {{ (loading() ? 'auth.forgotPassword.submitting' : 'auth.forgotPassword.submit') | translate }}
      </button>
    </form>
    <p class="mt-8 text-sm">
      <a routerLink="/auth/login" class="link-quiet">{{ 'auth.forgotPassword.backToLogin' | translate }}</a>
    </p>
  `,
})
export class ForgotPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);

  email = '';
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }

  submit(): void {
    const email = this.email.trim();
    if (!email || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(res?.message || this.i18n.translate('auth.forgotPassword.sent'));
        this.router.navigate(['/auth/reset-password'], { queryParams: { email } });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err, this.i18n.translate('auth.forgotPassword.failed')));
      },
    });
  }
}
