import { Component, input } from '@angular/core';
import { TasteProfile } from '../../../core/services/taste.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-taste-profile',
  imports: [TranslatePipe],
  template: `
    @if (profile(); as taste) {
      <section class="card space-y-4">
        <div class="flex items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">{{ 'profile.tasteTitle' | translate }}</h2>
            <p class="text-sm text-muted">
              {{ 'profile.tasteSummary' | translate: { count: taste.ratedCount, average: taste.averageRating } }}
            </p>
          </div>
        </div>
        @if (taste.genres.length === 0) {
          <p class="text-sm text-muted">{{ 'profile.tasteEmpty' | translate }}</p>
        } @else {
          <ul class="space-y-3">
            @for (genre of taste.genres; track genre.name) {
              <li>
                <div class="mb-1 flex justify-between text-sm">
                  <span>{{ genre.name }}</span>
                  <span class="text-muted">{{ genre.percentage }}%</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div class="h-full rounded-full bg-accent" [style.width.%]="genre.percentage"></div>
                </div>
              </li>
            }
          </ul>
        }
        @if (taste.mediaTypes.length) {
          <div class="flex flex-wrap gap-2 pt-1">
            @for (type of taste.mediaTypes; track type.name) {
              <span class="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                {{ type.name }} {{ type.percentage }}%
              </span>
            }
          </div>
        }
      </section>
    }
  `,
})
export class TasteProfileComponent {
  profile = input<TasteProfile | null>(null);
}
