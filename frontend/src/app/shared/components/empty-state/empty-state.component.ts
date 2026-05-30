import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state-box">
      @if (hasIcon()) {
        <div class="empty-state-icon">
          <ng-content select="[emptyIcon]" />
        </div>
      } @else {
        <ng-content select="[emptyIcon]" />
      }
      <p class="text-lg font-semibold tracking-tight text-text">{{ message() }}</p>
      @if (hint()) {
        <p class="mt-2 max-w-md text-sm leading-relaxed text-muted">{{ hint() }}</p>
      }
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  message = input.required<string>();
  hint = input<string>();
  hasIcon = input(true);
}
