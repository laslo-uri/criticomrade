import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { demoInterceptor } from './core/demo/demo.interceptor';
import { appIconsProvider } from './shared/icons/app-icons.provider';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { TranslationService } from './core/services/translation.service';
import { RuntimeService } from './core/services/runtime.service';

/** Startup order matters: theme → backend detection → language → session. */
async function bootstrap(): Promise<void> {
  const theme = inject(ThemeService);
  const runtime = inject(RuntimeService);
  const i18n = inject(TranslationService);
  const auth = inject(AuthService);

  theme.init();
  await Promise.all([runtime.init(), i18n.init()]);
  await firstValueFrom(auth.bootstrapSession());
  document.documentElement.classList.add('app-ready');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions({ skipInitialTransition: true })
    ),
    // authInterceptor runs first so the demo backend sees the bearer token.
    provideHttpClient(withInterceptors([authInterceptor, demoInterceptor])),
    appIconsProvider,
    provideAppInitializer(bootstrap),
  ],
};
