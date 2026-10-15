import { Component, inject, signal } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { RuntimeService } from '../../../core/services/runtime.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { storage } from '../../../core/utils/storage';

const DISMISS_KEY = 'criticomrade_demo_banner_dismissed';

/** A slim strip that explains demo mode once, until dismissed for the session. */
@Component({
  selector: 'app-demo-banner',
  imports: [TranslatePipe, LucideX],
  template: `
    @if (runtime.anyDemo() && !dismissed()) {
      <div class="relative z-50 bg-brass text-ink">
        <div class="mx-auto flex max-w-page items-center gap-3 px-4 py-1.5 text-[13px] font-medium leading-snug lg:px-6">
          <p class="min-w-0 flex-1">
            <strong class="font-bold">{{ 'demo.badge' | translate }}</strong>
            {{ (runtime.demo() ? 'demo.banner' : 'demo.bannerServer') | translate }}
          </p>
          <button type="button" class="-mr-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-ink/10" (click)="dismiss()" [attr.aria-label]="'common.close' | translate">
            <svg lucideX [size]="16" />
          </button>
        </div>
      </div>
    }
  `,
})
export class DemoBannerComponent {
  readonly runtime = inject(RuntimeService);
  readonly dismissed = signal(storage.get(DISMISS_KEY, 'session') === '1');

  dismiss(): void {
    storage.set(DISMISS_KEY, '1', 'session');
    this.dismissed.set(true);
  }
}
