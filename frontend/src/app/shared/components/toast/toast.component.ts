import { Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX } from '@lucide/angular';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-toast',
  imports: [LucideCircleCheck, LucideCircleAlert, LucideInfo, LucideX, TranslatePipe],
  template: `
    <div
      class="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end md:bottom-5"
      aria-live="polite"
      role="status"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="toast-item pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm shadow-lift"
          [class.border-success/40]="toast.type === 'success'"
          [class.border-danger/50]="toast.type === 'error'"
          [class.border-border]="toast.type === 'info'"
        >
          @switch (toast.type) {
            @case ('success') { <svg lucideCircleCheck [size]="18" class="mt-px shrink-0 text-success" /> }
            @case ('error') { <svg lucideCircleAlert [size]="18" class="mt-px shrink-0 text-danger" /> }
            @default { <svg lucideInfo [size]="18" class="mt-px shrink-0 text-brass-ink" /> }
          }
          <p class="min-w-0 flex-1 leading-snug text-text">{{ toast.message }}</p>
          <button type="button" class="-m-1 rounded p-1 text-muted hover:text-text" (click)="toasts.dismiss(toast.id)" [attr.aria-label]="'common.close' | translate">
            <svg lucideX [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toasts = inject(ToastService);
}
