import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { LucideSearch, LucideX } from '@lucide/angular';
import { MediaService } from '../../core/services/media.service';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

const GENRES: Record<string, string[]> = {
  FILM: ['Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Romance', 'Action', 'Animation', 'War'],
  SHOW: ['Drama', 'Comedy', 'Crime', 'Sci-Fi', 'Mystery'],
  BOOK: ['Literary fiction', 'Sci-Fi', 'Fantasy', 'Historical fiction', 'Satire'],
  ALBUM: ['Electronic', 'Rock', 'Folk', 'Hip-hop', 'R&B', 'Jazz'],
};
const TYPES: MediaType[] = ['FILM', 'SHOW', 'BOOK', 'ALBUM'];

@Component({
  selector: 'app-explore',
  imports: [FormsModule, TranslatePipe, LucideSearch, LucideX, MediaCardComponent, EmptyStateComponent],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'explore.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'explore.subtitle' | translate }}</p>
      </div>
    </header>

    <div class="tabs" role="tablist" [attr.aria-label]="'nav.mediaTypes' | translate">
      @for (type of types; track type) {
        <button type="button" role="tab" class="tab" [class.tab-active]="activeType() === type" [attr.aria-selected]="activeType() === type" (click)="setType(type)">
          {{ typeKey(type) | translate }}
        </button>
      }
    </div>

    <div class="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center">
      <form class="relative w-full lg:max-w-sm" role="search" (submit)="$event.preventDefault(); navigate()">
        <label class="sr-only" for="explore-q">{{ 'common.searchMedia' | translate }}</label>
        <svg lucideSearch [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="explore-q"
          type="search"
          class="input-field pl-10 pr-10"
          [placeholder]="'explore.searchPlaceholder' | translate"
          [ngModel]="query()"
          (ngModelChange)="onQuery($event)"
          name="q"
          autocomplete="off"
          enterkeyhint="search"
        />
        @if (query()) {
          <button type="button" class="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-text" (click)="onQuery(''); navigate()" [attr.aria-label]="'common.clear' | translate">
            <svg lucideX [size]="16" />
          </button>
        }
      </form>
      <div class="chip-row lg:mx-0 lg:px-0" [attr.aria-label]="'explore.genres' | translate">
        <button type="button" class="chip" [class.chip-active]="!activeGenre()" [attr.aria-pressed]="!activeGenre()" (click)="setGenre(null)">{{ 'explore.allGenres' | translate }}</button>
        @for (genre of genres(); track genre) {
          <button type="button" class="chip" [class.chip-active]="activeGenre() === genre" [attr.aria-pressed]="activeGenre() === genre" (click)="setGenre(genre)">{{ genreLabel(genre) }}</button>
        }
      </div>
    </div>

    <section class="mt-8" aria-live="polite">
      <div class="section-heading">
        <h2 class="section-title">{{ (query() ? 'explore.searchResults' : 'explore.popularNow') | translate }}</h2>
        @if (!loading() && visible().length) {
          <span class="text-sm text-muted">{{ 'explore.titleCount' | translate: { count: visible().length } }}</span>
        }
      </div>
      @if (loading()) {
        <div class="grid grid-cols-2 gap-x-4 gap-y-6 min-[480px]:grid-cols-3 sm:grid-cols-4 xl:grid-cols-5">
          @for (i of skeletons; track i) {
            <div>
              <div class="skeleton aspect-[2/3] w-full rounded-poster"></div>
              <div class="skeleton mt-2 h-3.5 w-3/4"></div>
              <div class="skeleton mt-1.5 h-3 w-1/2"></div>
            </div>
          }
        </div>
      } @else if (failed()) {
        <app-empty-state [message]="'common.loadFailed' | translate" [hint]="'explore.failedHint' | translate">
          <svg emptyIcon lucideSearch [size]="26" />
          <button type="button" class="btn-secondary" (click)="load()">{{ 'common.retry' | translate }}</button>
        </app-empty-state>
      } @else if (visible().length === 0) {
        <app-empty-state [message]="'explore.emptyMessage' | translate" [hint]="'explore.emptyHint' | translate">
          <svg emptyIcon lucideSearch [size]="26" />
          @if (query() || activeGenre()) {
            <button type="button" class="btn-secondary" (click)="clearFilters()">{{ 'explore.clearFilters' | translate }}</button>
          }
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-2 gap-x-4 gap-y-7 min-[480px]:grid-cols-3 sm:grid-cols-4 xl:grid-cols-5">
          @for (item of visible(); track item.externalKey ?? item.tmdbId ?? item.id ?? item.title) {
            <app-media-card [item]="item" />
          }
        </div>
      }
    </section>
  `,
})
export class ExploreComponent implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly i18n = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly types = TYPES;
  readonly skeletons = Array.from({ length: 10 }, (_, i) => i);

  readonly query = signal('');
  readonly activeType = signal<MediaType>('FILM');
  readonly activeGenre = signal<string | null>(null);
  readonly items = signal<MediaItem[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly genres = computed(() => GENRES[this.activeType()] ?? []);

  /** Genre chips stay English in the URL and filter, but are shown in the current language. */
  genreLabel(genre: string): string {
    const key = `explore.genre.${genre.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const label = this.i18n.translate(key);
    return label === key ? genre : label;
  }
  /** Genre filtering happens here when the API returns genres; otherwise the API search does it. */
  readonly visible = computed(() => {
    const genre = this.activeGenre();
    const items = this.items();
    if (!genre || !items.some((i) => i.genre)) return items;
    return items.filter((i) => (i.genre ?? '').toLowerCase().includes(genre.toLowerCase()));
  });

  private readonly typing$ = new Subject<void>();

  ngOnInit(): void {
    this.typing$.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.navigate());
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const type = params.get('type') as MediaType | null;
      this.activeType.set(type && TYPES.includes(type) ? type : 'FILM');
      this.query.set(params.get('q') ?? '');
      this.activeGenre.set(params.get('genre'));
      this.load();
    });
  }

  typeKey(type: MediaType): string {
    return { FILM: 'explore.films', SHOW: 'explore.shows', BOOK: 'explore.books', ALBUM: 'explore.albums', EPISODE: 'explore.shows' }[type];
  }

  setType(type: MediaType): void {
    this.activeType.set(type);
    this.activeGenre.set(null);
    this.navigate();
  }

  setGenre(genre: string | null): void {
    this.activeGenre.set(genre);
    this.navigate();
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.typing$.next();
  }

  clearFilters(): void {
    this.query.set('');
    this.activeGenre.set(null);
    this.navigate();
  }

  navigate(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.query().trim() || null, type: this.activeType(), genre: this.activeGenre() },
      replaceUrl: true,
    });
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    const q = this.query().trim();
    const request = q ? this.mediaService.search(this.activeType(), q) : this.mediaService.popular(this.activeType());
    request.subscribe({
      next: (items) => {
        const genre = this.activeGenre();
        // The Spring API's popular lists carry no genre; ask search for the genre instead.
        if (genre && items.length && !items.some((i) => i.genre)) {
          this.mediaService.search(this.activeType(), q ? `${q} ${genre}` : genre).subscribe({
            next: (byGenre) => this.done(byGenre),
            error: () => this.done(items),
          });
          return;
        }
        this.done(items);
      },
      error: () => {
        this.items.set([]);
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  private done(items: MediaItem[]): void {
    this.items.set(items);
    this.loading.set(false);
  }
}
