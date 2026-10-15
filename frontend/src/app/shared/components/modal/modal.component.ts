import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

/**
 * Accessible dialog: bottom sheet on phones, centred panel on larger screens.
 * Built on <dialog> so focus trapping, Escape and the backdrop come from the browser.
 */
@Component({
  selector: 'app-modal',
  imports: [LucideX, TranslatePipe],
  template: `
    <dialog
      #dialog
      class="modal-dialog"
      [class]="panelClass()"
      [attr.aria-label]="title()"
      (cancel)="$event.preventDefault(); closed.emit()"
      (click)="onBackdrop($event)"
    >
      <div class="flex max-h-[inherit] flex-col">
        <header class="flex items-center gap-3 border-b border-border/70 px-5 py-3.5">
          @if (title()) {
            <h2 class="min-w-0 flex-1 font-display text-2xl font-bold uppercase leading-none tracking-[0.02em]">{{ title() }}</h2>
          } @else {
            <span class="flex-1"></span>
          }
          <button type="button" class="icon-btn -mr-2" (click)="closed.emit()" [attr.aria-label]="'common.close' | translate">
            <svg lucideX [size]="20" />
          </button>
        </header>
        <div class="overflow-y-auto overscroll-contain px-5 py-5">
          <ng-content />
        </div>
      </div>
    </dialog>
  `,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input<string>();
  readonly panelClass = input('sm:max-w-lg');
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) {
        el.showModal();
        document.documentElement.classList.add('overflow-hidden');
      } else if (!this.open() && el.open) {
        el.close();
        document.documentElement.classList.remove('overflow-hidden');
      }
    });
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.closed.emit();
    }
  }
}
