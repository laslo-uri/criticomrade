import { Component, ElementRef, afterNextRender, effect, inject, viewChild } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ConsentService } from '../../../core/services/consent.service';

/**
 * Cookie banner (Consent Mode v2). Renders nothing unless an analytics ID is configured.
 * Fixed to the bottom of the screen, above the phone bottom nav.
 */
@Component({
  selector: 'app-cookie-consent',
  imports: [TranslatePipe],
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (consent.enabled && consent.open()) {
      <section
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-text"
        class="fixed inset-x-0 bottom-[4.5rem] z-50 p-3 sm:p-4 md:bottom-0"
      >
        <div class="panel mx-auto flex max-w-screen-md flex-col gap-3 p-4 shadow-lift sm:flex-row sm:items-center sm:gap-5">
          <div class="flex-1 text-sm">
            <h2 id="cookie-consent-title" class="font-display text-xl font-bold uppercase leading-none tracking-[0.02em] text-text">
              {{ 'cookies.title' | translate }}
            </h2>
            <p id="cookie-consent-text" class="mt-1.5 text-muted">{{ 'cookies.text' | translate }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button type="button" class="btn-secondary" (click)="consent.decide('denied')">{{ 'cookies.decline' | translate }}</button>
            <button #accept type="button" class="btn-primary" (click)="consent.decide('granted')">{{ 'cookies.accept' | translate }}</button>
          </div>
        </div>
      </section>
    }
  `,
})
export class CookieConsentComponent {
  readonly consent = inject(ConsentService);
  private readonly accept = viewChild<ElementRef<HTMLButtonElement>>('accept');

  constructor() {
    // Analytics never blocks the first render: the service starts after the app has mounted.
    afterNextRender(() => this.consent.init());
    effect(() => {
      if (this.consent.open() && this.consent.reopened()) {
        this.accept()?.nativeElement.focus();
      }
    });
  }

  onEscape(): void {
    if (this.consent.open()) this.consent.dismiss();
  }
}
