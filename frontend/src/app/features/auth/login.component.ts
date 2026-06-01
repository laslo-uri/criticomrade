import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
    selector: 'app-login',
    imports: [FormsModule, RouterLink, TranslatePipe, LogoComponent, PasswordFieldComponent],
    template: `
    <div class="auth-page">
      <div class="auth-page-inner">
        <app-logo variant="hero" />

        <div class="auth-form">
          <h1 class="auth-title">{{ 'auth.login.title' | translate }}</h1>

          <form class="auth-fields" (ngSubmit)="submit()">
            <div>
              <label class="auth-label">{{ 'auth.login.emailOrUsername' | translate }}</label>
              <input
                type="text"
                class="input-field"
                [(ngModel)]="username"
                name="username"
                required
                autocomplete="username"
              />
            </div>
            <div>
              <label class="auth-label">{{ 'auth.login.password' | translate }}</label>
              <app-password-field
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
                [required]="true"
              />
            </div>
            <label class="flex cursor-pointer items-center gap-2.5 text-sm text-muted">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-border accent-accent"
                [(ngModel)]="rememberMe"
                name="rememberMe"
              />
              {{ 'auth.login.rememberMe' | translate }}
            </label>
            <button type="submit" class="btn-primary w-full !py-3" [disabled]="loading()">
              {{ (loading() ? 'auth.login.submitting' : 'auth.login.submit') | translate }}
            </button>
            <p class="text-center text-sm">
              <a routerLink="/auth/forgot-password" class="text-accent hover:underline">
                {{ 'auth.login.forgotPassword' | translate }}
              </a>
            </p>
          </form>

          <p class="auth-footer">
            {{ 'auth.login.noAccount' | translate }}
            <a routerLink="/auth/register" class="text-accent hover:underline">
              {{ 'auth.login.registerLink' | translate }}
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translationService = inject(TranslationService);

  username = '';
  password = '';
  rememberMe = true;
  loading = signal(false);

  ngOnInit(): void {
    this.rememberMe = this.auth.rememberMePreference;
  }

  submit(): void {
    this.loading.set(true);
    this.auth
      .login({
        username: this.username,
        password: this.password,
        rememberMe: this.rememberMe,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error(this.translationService.translate('auth.login.invalidCredentials'));
          this.loading.set(false);
        },
      });
  }
}
