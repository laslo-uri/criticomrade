import { Component, computed, input, output, signal } from '@angular/core';
import { LucideStar } from '@lucide/angular';

/**
 * Five stars with half-star precision (0.5–5, stored as 1–10 by the API).
 * In input mode the left half of a star sets x.5, the right half sets x.0, and the
 * arrow keys step by halves.
 */
@Component({
  selector: 'app-star-rating',
  imports: [LucideStar],
  template: `
    @if (mode() === 'display') {
      <span class="inline-flex items-center gap-px" role="img" [attr.aria-label]="value() + ' / 5'">
        @for (star of stars; track star) {
          <span class="relative inline-flex" [style.width.px]="size()" [style.height.px]="size()">
            <svg lucideStar [size]="size()" class="absolute inset-0 text-border" [class.fill-border]="true" />
            @if (fill(star) > 0) {
              <span class="absolute inset-y-0 left-0 overflow-hidden" [style.width.%]="fill(star) * 100">
                <svg lucideStar [size]="size()" class="text-brass fill-brass" />
              </span>
            }
          </span>
        }
      </span>
    } @else {
      <div
        class="inline-flex items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brass"
        role="slider"
        tabindex="0"
        aria-valuemin="0"
        aria-valuemax="5"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuetext]="value() ? value() + ' / 5' : 'No rating'"
        [attr.aria-label]="label()"
        (keydown)="onKey($event)"
        (mouseleave)="hover.set(null)"
      >
        @for (star of stars; track star) {
          <span class="relative inline-flex cursor-pointer" [style.width.px]="size()" [style.height.px]="size()">
            <svg lucideStar [size]="size()" class="absolute inset-0 text-border fill-border" />
            @if (fill(star) > 0) {
              <span class="pointer-events-none absolute inset-y-0 left-0 overflow-hidden" [style.width.%]="fill(star) * 100">
                <svg lucideStar [size]="size()" class="text-brass fill-brass" />
              </span>
            }
            <button type="button" tabindex="-1" class="absolute inset-y-0 left-0 w-1/2" [attr.aria-label]="star - 0.5 + ' / 5'"
              (mouseenter)="hover.set(star - 0.5)" (click)="select(star - 0.5)"></button>
            <button type="button" tabindex="-1" class="absolute inset-y-0 right-0 w-1/2" [attr.aria-label]="star + ' / 5'"
              (mouseenter)="hover.set(star)" (click)="select(star)"></button>
          </span>
        }
        <span class="ml-2 min-w-8 font-display text-2xl font-bold tabular-nums leading-none text-text">
          {{ shown() ? shown() : '–' }}
        </span>
      </div>
    }
  `,
  host: { class: 'inline-flex' },
})
export class StarRatingComponent {
  readonly stars = [1, 2, 3, 4, 5];

  readonly mode = input<'display' | 'input'>('display');
  readonly value = input<number>(0);
  readonly size = input<number>(14);
  readonly label = input('Rating');
  readonly valueChange = output<number>();

  readonly hover = signal<number | null>(null);
  readonly shown = computed(() => this.hover() ?? this.value());

  fill(star: number): number {
    const v = this.shown();
    if (v >= star) return 1;
    if (v >= star - 0.5) return 0.5;
    return 0;
  }

  select(v: number): void {
    // Clicking the current value again clears it.
    this.valueChange.emit(v === this.value() ? 0 : v);
  }

  onKey(event: KeyboardEvent): void {
    const step = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    this.valueChange.emit(Math.min(5, Math.max(0, this.value() + step)));
  }
}
