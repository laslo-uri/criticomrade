import { Component, input } from '@angular/core';
import { TasteProfile } from '../../../core/services/taste.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { MEDIA_TYPE_KEYS } from '../../../core/utils/media-link';
import { MediaType } from '../../../core/models/media-item.model';

/** Genre bars and a media-type split, computed from someone's ratings. */
@Component({
  selector: 'app-taste-profile',
  imports: [TranslatePipe],
  template: `
    @if (profile(); as taste) {
      <section class="card" [attr.aria-label]="'profile.tasteTitle' | translate">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 class="section-title">{{ 'profile.tasteTitle' | translate }}</h2>
          <p class="text-sm text-muted">{{ 'profile.tasteSummary' | translate: { count: taste.ratedCount, average: taste.averageRating } }}</p>
        </div>
        @if (taste.genres.length === 0) {
          <p class="mt-3 text-sm text-muted">{{ 'profile.tasteEmpty' | translate }}</p>
        } @else {
          <ul class="mt-4 space-y-2.5">
            @for (genre of taste.genres.slice(0, 6); track genre.name; let i = $index) {
              <li class="grid grid-cols-[7.5rem_1fr_2.75rem] items-center gap-3 text-sm">
                <span class="truncate">{{ genre.name }}</span>
                <span class="h-2.5 overflow-hidden rounded-sm bg-elevated">
                  <span class="block h-full rounded-sm" [class]="i === 0 ? 'bg-accent' : 'bg-brass/80'" [style.width.%]="barWidth(genre.percentage, taste.genres[0].percentage)"></span>
                </span>
                <span class="text-right tabular-nums text-muted">{{ genre.percentage }}%</span>
              </li>
            }
          </ul>
        }
        @if (taste.mediaTypes.length) {
          <div class="mt-4 flex flex-wrap gap-1.5 border-t border-border/70 pt-4">
            @for (type of taste.mediaTypes; track type.name) {
              <span class="tag bg-elevated text-[12px] text-text/90">{{ typeLabel(type.name) | translate }} {{ type.percentage }}%</span>
            }
          </div>
        }
      </section>
    }
  `,
})
export class TasteProfileComponent {
  readonly profile = input<TasteProfile | null>(null);

  barWidth(value: number, max: number): number {
    return Math.max(4, Math.round((value / (max || 1)) * 100));
  }

  typeLabel(name: string): string {
    return MEDIA_TYPE_KEYS[name as MediaType] ?? name;
  }
}
