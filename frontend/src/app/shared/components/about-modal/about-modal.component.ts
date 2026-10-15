import { Component, inject, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LocalDatePipe } from '../../../core/pipes/local-date.pipe';
import { APP_INFO } from '../../../core/constants/app-info';
import { RuntimeService } from '../../../core/services/runtime.service';

@Component({
  selector: 'app-about-modal',
  imports: [ModalComponent, TranslatePipe, LocalDatePipe],
  template: `
    <app-modal [open]="open()" [title]="'about.title' | translate" panelClass="sm:max-w-sm" (closed)="closed.emit()">
      <div class="space-y-4 text-sm">
        <p class="leading-relaxed text-text/90">{{ 'about.description' | translate }}</p>
        <dl class="divide-y divide-border/70 rounded-lg border border-border/70">
          <div class="flex justify-between gap-3 px-3 py-2">
            <dt class="text-muted">{{ 'about.version' | translate }}</dt>
            <dd class="font-semibold tabular-nums">v{{ info.version }}</dd>
          </div>
          <div class="flex justify-between gap-3 px-3 py-2">
            <dt class="text-muted">{{ 'about.lastUpdated' | translate }}</dt>
            <dd class="font-semibold">{{ info.lastUpdated + '-01' | localDate: 'month' }}</dd>
          </div>
          <div class="flex justify-between gap-3 px-3 py-2">
            <dt class="text-muted">{{ 'about.backend' | translate }}</dt>
            <dd class="font-semibold">{{ (runtime.demo() ? 'about.backendDemo' : runtime.serverDemo() ? 'about.backendServer' : 'about.backendLive') | translate }}</dd>
          </div>
        </dl>
        <p class="text-[13px] text-muted">{{ 'about.footer' | translate }}</p>
      </div>
    </app-modal>
  `,
})
export class AboutModalComponent {
  readonly runtime = inject(RuntimeService);
  readonly open = input(false);
  readonly closed = output<void>();
  readonly info = APP_INFO;
}
