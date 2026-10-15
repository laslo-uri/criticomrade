import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideBookmark, LucidePenLine, LucideX } from '@lucide/angular';
import { ListService } from '../../core/services/list.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { UiService } from '../../core/services/ui.service';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MEDIA_TYPE_KEYS } from '../../core/utils/media-link';

@Component({
  selector: 'app-watchlist',
  imports: [RouterLink, TranslatePipe, LucideBookmark, LucideX, LucidePenLine, MediaCardComponent, EmptyStateComponent],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'watchlist.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'watchlist.subtitle' | translate }}</p>
      </div>
    </header>

    @if (types().length > 1) {
      <div class="chip-row mb-6">
        <button type="button" class="chip" [class.chip-active]="!filter()" (click)="filter.set(null)">{{ 'explore.allGenres' | translate }} ({{ items().length }})</button>
        @for (t of types(); track t) {
          <button type="button" class="chip" [class.chip-active]="filter() === t" (click)="filter.set(t)">{{ typeKey(t) | translate }}</button>
        }
      </div>
    }

    @if (loading()) {
      <div class="grid grid-cols-2 gap-4 min-[480px]:grid-cols-3 sm:grid-cols-4 xl:grid-cols-5">
        @for (i of [1, 2, 3, 4, 5]; track i) { <div class="skeleton aspect-[2/3] w-full rounded-poster"></div> }
      </div>
    } @else if (items().length === 0) {
      <app-empty-state [message]="'watchlist.emptyMessage' | translate" [hint]="'watchlist.emptyHint' | translate">
        <svg emptyIcon lucideBookmark [size]="26" />
        <a routerLink="/explore" class="btn-primary">{{ 'nav.explore' | translate }}</a>
      </app-empty-state>
    } @else {
      <div class="grid grid-cols-2 gap-x-4 gap-y-7 min-[480px]:grid-cols-3 sm:grid-cols-4 xl:grid-cols-5">
        @for (item of visible(); track item.id ?? item.tmdbId ?? item.title) {
          <div class="relative">
            <app-media-card [item]="item" />
            <div class="mt-2 flex gap-1.5">
              <button type="button" class="btn-secondary btn-sm flex-1 !px-2" (click)="ui.openReview(item)">
                <svg lucidePenLine [size]="14" /> {{ 'watchlist.log' | translate }}
              </button>
              <button type="button" class="icon-btn h-9 w-9 border border-border" (click)="remove(item)" [attr.aria-label]="'watchlist.removeTitle' | translate: { title: item.title }">
                <svg lucideX [size]="15" />
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class WatchlistComponent implements OnInit {
  private readonly listService = inject(ListService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  readonly ui = inject(UiService);

  readonly items = signal<MediaItem[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<MediaType | null>(null);
  private listId = 0;
  private readonly destroyRef = inject(DestroyRef);

  readonly types = computed(() => [...new Set(this.items().map((i) => i.mediaType ?? 'FILM'))]);
  readonly visible = computed(() => {
    const f = this.filter();
    return f ? this.items().filter((i) => (i.mediaType ?? 'FILM') === f) : this.items();
  });

  ngOnInit(): void {
    this.load();
    this.ui.reviewPublished$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  typeKey(type: MediaType): string {
    return MEDIA_TYPE_KEYS[type];
  }

  remove(item: MediaItem): void {
    if (item.id == null) return;
    const before = this.items();
    this.items.update((list) => list.filter((x) => x.id !== item.id));
    this.listService.removeMovie(this.listId, item.id).subscribe({
      next: () => this.toast.success(this.i18n.translate('watchlist.removed', { title: item.title })),
      error: () => {
        this.items.set(before);
        this.toast.error(this.i18n.translate('watchlist.couldNotRemove'));
      },
    });
  }

  private load(): void {
    this.listService.getWatchlist().subscribe({
      next: (list) => {
        this.listId = list.id;
        this.items.set(list.movies ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
