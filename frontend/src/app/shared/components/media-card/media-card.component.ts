import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MediaItem, MediaType } from '../../../core/models/media-item.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-media-card',
  imports: [RouterLink, TranslatePipe, DecimalPipe],
  template: `
    <a
      [routerLink]="link()"
      [queryParams]="query()"
      class="group block overflow-hidden rounded-xl border border-white/5 bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
      [style.view-transition-name]="item().id ? 'media-' + item().id : null"
    >
      <div class="relative aspect-[2/3] overflow-hidden bg-elevated">
        @if (item().posterApiLink) {
          <img
            [src]="item().posterApiLink"
            [alt]="item().title"
            loading="lazy"
            class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        } @else {
          <div class="flex h-full items-center justify-center px-3 text-center text-sm text-muted">
            {{ 'common.noPoster' | translate }}
          </div>
        }
        <span class="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {{ typeLabel() }}
        </span>
        @if (item().imdbRating) {
          <span class="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-secondary">
            {{ item().imdbRating | number: '1.1-1' }}
          </span>
        }
      </div>
      <div class="p-3">
        <h3 class="truncate text-sm font-medium">{{ item().title }}</h3>
        <p class="truncate text-xs text-muted">
          {{ item().creator || item().year || typeLabel() }}
        </p>
      </div>
    </a>
  `,
})
export class MediaCardComponent {
  item = input.required<MediaItem>();

  typeLabel = computed(() => {
    const labels: Record<MediaType, string> = {
      FILM: 'Film',
      SHOW: 'Show',
      EPISODE: 'Episode',
      BOOK: 'Book',
      ALBUM: 'Album',
    };
    return labels[this.item().mediaType ?? 'FILM'];
  });

  link = computed(() => {
    const item = this.item();
    if (item.id) {
      return ['/media', item.id];
    }
    if (item.tmdbId && (item.mediaType ?? 'FILM') === 'FILM') {
      return ['/movies/tmdb', item.tmdbId];
    }
    return ['/media/resolve'];
  });

  query = computed(() => {
    const item = this.item();
    if (item.id || (item.tmdbId && (item.mediaType ?? 'FILM') === 'FILM')) {
      return null;
    }
    const key = item.externalKey ?? '';
    const bare = key.includes(':') ? key.slice(key.indexOf(':') + 1) : key;
    return { type: item.mediaType ?? 'FILM', key: bare };
  });
}
