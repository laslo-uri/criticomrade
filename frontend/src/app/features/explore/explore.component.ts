import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideSearch } from '@lucide/angular';
import { MediaService } from '../../core/services/media.service';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-explore',
  imports: [FormsModule, TranslatePipe, LucideSearch, MediaCardComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <header class="page-header !mb-0">
        <h1 class="page-title">{{ 'explore.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'explore.subtitle' | translate }}</p>
      </header>

      <div class="chip-row" role="tablist">
        @for (type of types; track type.id) {
          <button
            type="button"
            class="min-h-11 shrink-0 rounded-full border px-3 text-sm"
            [class.border-accent]="activeType() === type.id"
            [class.bg-accent]="activeType() === type.id"
            [class.text-white]="activeType() === type.id"
            [class.border-border]="activeType() !== type.id"
            (click)="setType(type.id)"
          >
            {{ type.labelKey | translate }}
          </button>
        }
      </div>

      <div class="chip-row" aria-label="Genres">
        <button type="button" class="min-h-11 shrink-0 rounded-full border px-3 text-sm" [class.border-accent]="!activeGenre()" [class.text-accent]="!activeGenre()" [class.border-border]="!!activeGenre()" (click)="setGenre(null)">
          {{ 'explore.allGenres' | translate }}
        </button>
        @for (genre of genres; track genre.searchTerm) {
          <button type="button" class="min-h-11 shrink-0 rounded-full border px-3 text-sm" [class.border-accent]="activeGenre() === genre.searchTerm" [class.text-accent]="activeGenre() === genre.searchTerm" [class.border-border]="activeGenre() !== genre.searchTerm" (click)="setGenre(genre.searchTerm)">
            {{ genre.labelKey | translate }}
          </button>
        }
      </div>

      <form class="relative max-w-xl" (submit)="onSearch($event)">
        <svg lucideSearch [size]="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          class="input-field min-h-11 pl-10"
          [placeholder]="'common.searchMedia' | translate"
          [(ngModel)]="query"
          name="q"
        />
      </form>

      <section>
        <div class="section-heading">
          <h2 class="section-title">
            {{ (query.trim() ? 'explore.searchResults' : 'explore.popularNow') | translate }}
          </h2>
          @if (items().length) {
            <span class="text-sm text-muted">{{ 'explore.titleCount' | translate: { count: items().length } }}</span>
          }
        </div>
        @if (loading() && items().length === 0) {
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            @for (i of skeletons; track i) {
              <div class="space-y-2">
                <div class="skeleton aspect-[2/3] w-full"></div>
                <div class="skeleton h-3 w-3/4"></div>
              </div>
            }
          </div>
        } @else if (items().length === 0) {
          <app-empty-state [message]="'explore.emptyMessage' | translate" [hint]="'explore.emptyHint' | translate">
            <svg emptyIcon lucideSearch [size]="28" />
          </app-empty-state>
        } @else {
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            @for (item of items(); track item.externalKey ?? item.tmdbId ?? item.id ?? item.title) {
              <app-media-card [item]="item" />
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class ExploreComponent {
  private readonly mediaService = inject(MediaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly types: { id: MediaType; labelKey: string }[] = [
    { id: 'FILM', labelKey: 'explore.films' },
    { id: 'SHOW', labelKey: 'explore.shows' },
    { id: 'BOOK', labelKey: 'explore.books' },
    { id: 'ALBUM', labelKey: 'explore.albums' },
  ];
  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  readonly genres: { labelKey: string; searchTerm: string }[] = [
    { labelKey: 'explore.genre.action', searchTerm: 'Action' },
    { labelKey: 'explore.genre.comedy', searchTerm: 'Comedy' },
    { labelKey: 'explore.genre.drama', searchTerm: 'Drama' },
    { labelKey: 'explore.genre.scifi', searchTerm: 'Sci-Fi' },
    { labelKey: 'explore.genre.horror', searchTerm: 'Horror' },
    { labelKey: 'explore.genre.romance', searchTerm: 'Romance' },
    { labelKey: 'explore.genre.fantasy', searchTerm: 'Fantasy' },
    { labelKey: 'explore.genre.thriller', searchTerm: 'Thriller' },
  ];

  query = '';
  activeType = signal<MediaType>('FILM');
  activeGenre = signal<string | null>(null);
  items = signal<MediaItem[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.query = params['q'] ?? '';
      const type = params['type'] as MediaType | undefined;
      if (type) this.activeType.set(type);
      this.activeGenre.set(params['genre'] ?? null);
      this.load();
    });
  }

  setType(type: MediaType): void {
    this.activeType.set(type);
    this.navigate();
  }

  setGenre(genre: string | null): void {
    this.activeGenre.set(genre);
    this.navigate();
  }

  onSearch(event: Event): void {
    event.preventDefault();
    this.navigate();
  }

  private navigate(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.query.trim() || null, type: this.activeType(), genre: this.activeGenre() },
    });
  }

  private load(): void {
    this.loading.set(true);
    const genre = this.activeGenre();
    const typed = [this.query.trim(), genre ?? ''].filter(Boolean).join(' ');
    const request = typed
      ? this.mediaService.search(this.activeType(), typed)
      : this.mediaService.popular(this.activeType());
    request.subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }
}
