import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { appIconsProvider } from './shared/icons/app-icons.provider';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { TranslationService } from './core/services/translation.service';

function bootstrapAuth(auth: AuthService) {
  return () => firstValueFrom(auth.bootstrapSession());
}

function bootstrapTheme(theme: ThemeService) {
  return () => {
    theme.init();
  };
}

function bootstrapI18n(i18n: TranslationService) {
  return () => i18n.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    appIconsProvider,
    {
      provide: APP_INITIALIZER,
      useFactory: bootstrapTheme,
      deps: [ThemeService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: bootstrapI18n,
      deps: [TranslationService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: bootstrapAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
};
