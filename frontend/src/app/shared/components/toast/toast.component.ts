import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    imports: [NgClass],
    template: `
    <div class="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 md:bottom-4">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-item flex min-w-[240px] max-w-sm items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg"
          [ngClass]="{
            'border-green-500/30 bg-green-950/90': toast.type === 'success',
            'border-red-500/30 bg-red-950/90': toast.type === 'error',
            'border-border bg-elevated': toast.type === 'info'
          }"
        >
          <span class="text-sm">{{ toast.message }}</span>
          <button
            type="button"
            class="text-muted hover:text-text"
            (click)="toastService.dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
