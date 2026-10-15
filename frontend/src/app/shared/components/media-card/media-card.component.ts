import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideStar } from '@lucide/angular';
import { MediaItem } from '../../../core/models/media-item.model';
import { mediaLink } from '../../../core/utils/media-link';
import { PosterComponent } from '../poster/poster.component';

@Component({
  selector: 'app-media-card',
  imports: [RouterLink, DecimalPipe, PosterComponent, LucideStar],
  template: `
    <a
      [routerLink]="link().commands"
      [queryParams]="link().queryParams"
      class="group block rounded-poster focus-visible:outline-offset-4"
    >
      <div
        class="relative aspect-[2/3] overflow-hidden rounded-poster shadow-poster ring-1 ring-inset ring-text/5 transition duration-200 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-brass/70"
      >
        <app-poster
          class="h-full w-full"
          [title]="item().title"
          [src]="item().posterApiLink"
          [mediaType]="item().mediaType"
          [year]="item().year"
          [creator]="item().creator"
        />
        @if (item().imdbRating) {
          <span
            class="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-[4px] bg-ink/85 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-paper backdrop-blur-sm"
            [attr.aria-label]="'Score ' + (item().imdbRating | number: '1.1-1')"
          >
            <svg lucideStar [size]="11" class="fill-brass text-brass" />
            {{ item().imdbRating | number: '1.1-1' }}
          </span>
        }
      </div>
      <div class="mt-2 min-w-0 px-0.5">
        <h3 class="truncate text-[14px] font-semibold leading-snug text-text group-hover:text-accent-ink">
          {{ item().title }}
        </h3>
        <p class="truncate text-[12.5px] text-muted">{{ subtitle() }}</p>
      </div>
    </a>
  `,
})
export class MediaCardComponent {
  readonly item = input.required<MediaItem>();
  readonly link = computed(() => mediaLink(this.item()));
  readonly subtitle = computed(() => {
    const { creator, year } = this.item();
    return [year, creator].filter(Boolean).join(', ');
  });
}
