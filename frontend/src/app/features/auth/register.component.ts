import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { errorMessage } from '../../core/utils/http-error';
import { safeReturnUrl } from './login.component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, TranslatePipe, PasswordFieldComponent],
  template: `
    <h1 class="page-title">{{ 'auth.register.title' | translate }}</h1>
    <p class="page-subtitle">{{ 'auth.register.subtitle' | translate }}</p>

    <form class="mt-7 space-y-4" (ngSubmit)="submit()" #f="ngForm">
      <label class="block">
        <span class="field-label">{{ 'auth.register.username' | translate }}</span>
        <input type="text" class="input-field" [(ngModel)]="username" name="username" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_.]+" autocomplete="username" autocapitalize="none" spellcheck="false" />
        <span class="field-hint block">{{ 'auth.register.usernameHint' | translate }}</span>
      </label>
      <label class="block">
        <span class="field-label">{{ 'auth.register.email' | translate }}</span>
        <input type="email" class="input-field" [(ngModel)]="email" name="email" required email autocomplete="email" />
      </label>
      <label class="block">
        <span class="field-label">{{ 'auth.register.fullName' | translate }} <span class="font-normal text-muted">{{ 'common.optional' | translate }}</span></span>
        <input type="text" class="input-field" [(ngModel)]="fullName" name="fullName" autocomplete="name" />
      </label>
      <div>
        <label for="register-password" class="field-label">{{ 'auth.register.password' | translate }}</label>
        <app-password-field inputId="register-password" [(ngModel)]="password" name="password" autocomplete="new-password" [required]="true" [minlength]="8" />
        <span class="field-hint block">{{ 'auth.register.passwordHint' | translate }}</span>
      </div>
      @if (error()) {
        <p class="text-sm font-medium text-danger" role="alert">{{ error() }}</p>
      }
      <button type="submit" class="btn-primary w-full" [disabled]="loading() || !f.valid || password.length < 8">
        {{ (loading() ? 'auth.register.submitting' : 'auth.register.submit') | translate }}
      </button>
    </form>

    <p class="mt-8 text-sm text-muted">
      {{ 'auth.register.hasAccount' | translate }}
      <a routerLink="/auth/login" class="link-quiet">{{ 'auth.register.signInLink' | translate }}</a>
    </p>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(TranslationService);

  username = '';
  email = '';
  fullName = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth
      .register({
        username: this.username.trim(),
        email: this.email.trim(),
        password: this.password,
        fullName: this.fullName.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')));
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(errorMessage(err, this.i18n.translate('auth.register.failed')));
        },
      });
  }
}
