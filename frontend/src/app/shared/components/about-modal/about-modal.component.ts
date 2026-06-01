import { Component, inject, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { APP_INFO } from '../../../core/constants/app-info';
import { TranslationService, Locale } from '../../../core/services/translation.service';

const LOCALE_MAP: Record<Locale, string> = {
  en: 'en-US',
  sr: 'sr-Latn-RS',
  hu: 'hu-HU',
  de: 'de-DE',
};

@Component({
    selector: 'app-about-modal',
    imports: [ModalComponent, TranslatePipe],
    template: `
    <app-modal
      [open]="open()"
      [title]="'about.title' | translate"
      panelClass="max-w-xs"
      headerClass="px-4 py-2.5"
      bodyClass="px-4 py-3"
      (closed)="closed.emit()"
    >
      <div class="space-y-3">
        <p class="text-sm leading-snug text-muted">{{ 'about.description' | translate }}</p>

        <dl class="divide-y divide-border rounded-lg border border-border bg-elevated/50 text-sm">
          <div class="flex items-center justify-between gap-3 px-3 py-2">
            <dt class="text-muted">{{ 'about.version' | translate }}</dt>
            <dd class="font-medium tabular-nums text-text">v{{ version }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3 px-3 py-2">
            <dt class="text-muted">{{ 'about.lastUpdated' | translate }}</dt>
            <dd class="font-medium tabular-nums text-text">{{ formattedLastUpdated }}</dd>
          </div>
        </dl>

        <p class="text-center text-[11px] text-muted">{{ 'about.footer' | translate }}</p>
      </div>
    </app-modal>
  `
})
export class AboutModalComponent {
  private readonly i18n = inject(TranslationService);

  readonly open = input(false);
  readonly closed = output<void>();

  readonly version = APP_INFO.version;

  get formattedLastUpdated(): string {
    this.i18n.locale();
    const locale = LOCALE_MAP[this.i18n.locale()] ?? 'en-US';
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(`${APP_INFO.lastUpdated}-01T12:00:00`)
    );
  }
}
