import { Component, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  group,
} from '@angular/animations';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

@Component({
    selector: 'app-modal',
    imports: [LucideX, TranslatePipe], animations: [
        trigger('modalOverlay', [
            transition(':enter', [
                group([
                    query('.modal-backdrop', [
                        style({ opacity: 0 }),
                        animate('220ms ease-out', style({ opacity: 1 })),
                    ]),
                    query('.modal-panel', [
                        style({ opacity: 0, transform: 'scale(0.96) translateY(16px)' }),
                        animate(`360ms ${ease}`, style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
                    ]),
                ]),
            ]),
            transition(':leave', [
                group([
                    query('.modal-backdrop', [
                        animate('180ms ease-in', style({ opacity: 0 })),
                    ]),
                    query('.modal-panel', [
                        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.98) translateY(8px)' })),
                    ]),
                ]),
            ]),
        ]),
    ],
    template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4"
        @modalOverlay
        (click)="onBackdropClick($event)"
      >
        <div class="modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div
          class="modal-panel relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-2xl md:rounded-xl"
          [class]="panelClass()"
          (click)="$event.stopPropagation()"
        >
          <div class="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border md:hidden" aria-hidden="true"></div>
          <div
            class="flex items-center gap-2 border-b border-border"
            [class]="headerClass()"
            [class.justify-end]="!title()"
          >
            @if (title()) {
              <h2 class="min-w-0 flex-1 pr-2 text-lg font-semibold leading-tight">{{ title() }}</h2>
            }
            <button
              type="button"
              class="modal-close"
              (click)="close()"
              [attr.aria-label]="'common.close' | translate"
            >
              <svg lucideX [size]="20" strokeWidth="2.5" />
            </button>
          </div>
          <div class="px-6 py-4">
            <ng-content />
          </div>
        </div>      </div>
    }
  `
})
export class ModalComponent {
  open = input(false);
  title = input<string>();
  panelClass = input('max-w-lg');
  headerClass = input('px-4 py-3 sm:px-6 sm:py-4');
  bodyClass = input('px-6 py-4');
  closed = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.closed.emit();
    }
  }

  close(): void {
    this.closed.emit();
  }
}