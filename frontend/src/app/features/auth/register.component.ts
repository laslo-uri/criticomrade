import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
    selector: 'app-register',
    imports: [FormsModule, RouterLink, TranslatePipe, LogoComponent, PasswordFieldComponent],
    template: `
    <div class="auth-page">
      <div class="auth-page-inner">
        <app-logo variant="hero" />

        <div class="auth-form">
          <h1 class="auth-title">{{ 'auth.register.title' | translate }}</h1>

          <form class="auth-fields" (ngSubmit)="submit()">
            <div>
              <label class="auth-label">{{ 'auth.register.username' | translate }}</label>
              <input type="text" class="input-field" [(ngModel)]="username" name="username" required />
            </div>
            <div>
              <label class="auth-label">{{ 'auth.register.email' | translate }}</label>
              <input type="email" class="input-field" [(ngModel)]="email" name="email" required />
            </div>
            <div>
              <label class="auth-label">{{ 'auth.register.fullName' | translate }}</label>
              <input type="text" class="input-field" [(ngModel)]="fullName" name="fullName" />
            </div>
            <div>
              <label class="auth-label">{{ 'auth.register.password' | translate }}</label>
              <app-password-field
                [(ngModel)]="password"
                name="password"
                autocomplete="new-password"
                [required]="true"
              />
            </div>
            <button type="submit" class="btn-primary w-full !py-3" [disabled]="loading()">
              {{ (loading() ? 'auth.register.submitting' : 'auth.register.submit') | translate }}
            </button>
          </form>

          <p class="auth-footer">
            {{ 'auth.register.hasAccount' | translate }}
            <a routerLink="/auth/login" class="text-accent hover:underline">
              {{ 'auth.register.signInLink' | translate }}
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translationService = inject(TranslationService);

  username = '';
  email = '';
  fullName = '';
  password = '';
  loading = signal(false);

  submit(): void {
    this.loading.set(true);
    this.auth
      .register({
        username: this.username,
        email: this.email,
        password: this.password,
        fullName: this.fullName || undefined,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error(this.translationService.translate('auth.register.failed'));
          this.loading.set(false);
        },
      });
  }
}
