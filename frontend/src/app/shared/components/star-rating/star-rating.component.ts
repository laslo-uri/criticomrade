import { Component, input, output } from '@angular/core';
import { LucideStar } from '@lucide/angular';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [LucideStar],
  template: `
    <div class="flex items-center gap-0.5" [class.cursor-pointer]="mode() === 'input'">
      @for (star of stars; track star) {
        <button
          type="button"
          class="p-0.5 transition hover:scale-110 disabled:cursor-default"
          [disabled]="mode() === 'display'"
          (click)="onSelect(star)"
        >
          <svg
            lucideStar
            [size]="size()"
            [class.text-accent]="star <= value()"
            [class.text-muted]="star > value()"
            [class.fill-accent]="star <= value()"
          />
        </button>
      }
    </div>
  `,
})
export class StarRatingComponent {
  readonly stars = [1, 2, 3, 4, 5];

  mode = input<'display' | 'input'>('display');
  value = input<number>(0);
  size = input<number>(16);
  valueChange = output<number>();

  onSelect(star: number): void {
    if (this.mode() === 'input') {
      this.valueChange.emit(star);
    }
  }
}
