import { Component, input } from '@angular/core';

/** Empty screens say what to do next. Put an icon in [emptyIcon] and actions as content. */
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state-box">
      <div class="empty-state-icon"><ng-content select="[emptyIcon]" /></div>
      <p class="font-display text-2xl font-bold uppercase leading-none tracking-[0.02em] text-text">{{ message() }}</p>
      @if (hint()) {
        <p class="mt-2 max-w-sm text-sm leading-relaxed text-muted">{{ hint() }}</p>
      }
      <div class="mt-5 flex flex-wrap items-center justify-center gap-2 empty:hidden"><ng-content /></div>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly message = input.required<string>();
  readonly hint = input<string>();
}
