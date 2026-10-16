import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LOCALES, Locale, TranslationService } from '../../../core/services/translation.service';
import { RuntimeService } from '../../../core/services/runtime.service';
import { AboutModalComponent } from '../about-modal/about-modal.component';
import { APP_INFO } from '../../../core/constants/app-info';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe, AboutModalComponent],
  template: `
    <footer class="border-t border-border/70 pt-6 text-[13px] text-muted">
      <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
        <a routerLink="/explore" class="py-1 hover:text-text">{{ 'nav.explore' | translate }}</a>
        <a routerLink="/people" class="py-1 hover:text-text">{{ 'nav.people' | translate }}</a>
        <a routerLink="/stats" class="py-1 hover:text-text">{{ 'nav.stats' | translate }}</a>
        <button type="button" class="py-1 hover:text-text" (click)="aboutOpen.set(true)">{{ 'about.title' | translate }}</button>
        <label class="ml-auto inline-flex items-center gap-2">
          <span class="sr-only">{{ 'settings.language' | translate }}</span>
          <select class="rounded-md border border-border bg-surface px-2 py-1 text-[13px] text-text" [value]="i18n.locale()" (change)="setLocale($event)">
            @for (loc of locales; track loc.code) {
              <option [value]="loc.code">{{ loc.label }}</option>
            }
          </select>
        </label>
      </div>
      <p class="mt-4 pb-2">
        CritiComrade v{{ version }}.
        @if (runtime.demo()) {
          {{ 'footer.demo' | translate }}
        } @else if (runtime.serverDemo()) {
          {{ 'footer.demoServer' | translate }}
        } @else {
          {{ 'footer.live' | translate }}
        }
      </p>
    </footer>
    <app-about-modal [open]="aboutOpen()" (closed)="aboutOpen.set(false)" />
  `,
})
export class FooterComponent {
  readonly i18n = inject(TranslationService);
  readonly runtime = inject(RuntimeService);
  readonly locales = LOCALES;
  readonly version = APP_INFO.version;
  readonly aboutOpen = signal(false);

  setLocale(event: Event): void {
    this.i18n.setLocale((event.target as HTMLSelectElement).value as Locale);
  }
}
