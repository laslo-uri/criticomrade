import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { LucideExternalLink, LucideHeart, LucidePenLine } from '@lucide/angular';
import { MovieService } from '../../core/services/movie.service';
import { MediaCredits, MediaService } from '../../core/services/media.service';
import { ReviewService } from '../../core/services/review.service';
import { ListService } from '../../core/services/list.service';
import { ReactionService } from '../../core/services/reaction.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { Review } from '../../core/models/review.model';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { WriteReviewModalComponent } from '../../shared/components/write-review-modal/write-review-modal.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-media-detail',
  imports: [
    DecimalPipe,
    TranslatePipe,
    LucidePenLine,
    LucideHeart,
    LucideExternalLink,
    ReviewCardComponent,
    EmptyStateComponent,
    WriteReviewModalComponent,
  ],
  template: `
    @if (item(); as media) {
      <div class="space-y-8">
        @if (media.backdropApiLink) {
          <div class="relative -mx-4 -mt-4 h-48 overflow-hidden sm:-mx-6 md:h-64">
            <img [src]="media.backdropApiLink" alt="" class="h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-bg to-transparent"></div>
          </div>
        }
        <section class="flex flex-col gap-6 md:flex-row">
          <div class="mx-auto w-44 shrink-0 md:mx-0 md:w-56">
            @if (media.posterApiLink) {
              <img [src]="media.posterApiLink" [alt]="media.title" class="w-full rounded-xl shadow-2xl" />
            }
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-secondary">{{ media.mediaType || 'FILM' }}</p>
            <h1 class="mt-1 text-3xl font-bold tracking-tight">{{ media.title }}</h1>
            <p class="mt-1 text-muted">
              {{ media.creator }}
              @if (media.creator && media.year) { · }
              {{ media.year }}
              @if (media.network) { · {{ media.network }} }
              @if (media.seasonCount) { · {{ media.seasonCount }} seasons }
              @if (media.pageCount) { · {{ media.pageCount }} pages }
              @if (media.trackCount) { · {{ media.trackCount }} tracks }
            </p>
            @if (media.genre) {
              <p class="mt-2 text-sm text-muted">{{ media.genre }}</p>
            }
            @if (media.imdbRating || media.rottenTomatoesRating) {
              <div class="mt-4 flex flex-wrap gap-3 text-sm">
                @if (media.imdbRating) {
                  <span class="rounded-md bg-elevated px-2 py-1">Score {{ media.imdbRating | number: '1.1-1' }}</span>
                }
                @if (media.rottenTomatoesRating) {
                  <span class="rounded-md bg-elevated px-2 py-1">RT {{ media.rottenTomatoesRating | number: '1.0-0' }}%</span>
                }
              </div>
            }
            @if (media.description) {
              <p class="mt-4 max-w-2xl leading-relaxed text-text/90">{{ media.description }}</p>
            }
            <div class="mt-6 flex flex-wrap gap-3 max-md:fixed max-md:inset-x-0 max-md:bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] max-md:z-30 max-md:border-t max-md:border-border max-md:bg-bg/95 max-md:px-4 max-md:py-2 max-md:backdrop-blur">
              @if (auth.isLoggedIn()) {
                <button type="button" class="btn-primary min-h-11" (click)="reviewModalOpen.set(true)">
                  <svg lucidePenLine [size]="16" />
                  {{ 'movie.writeReview' | translate }}
                </button>
                @if ((media.mediaType ?? 'FILM') === 'FILM' && media.tmdbId) {
                  <button type="button" class="btn-secondary min-h-11" (click)="addToWatchlist()">
                    {{ 'movie.addToWatchlist' | translate }}
                  </button>
                }
                @if (media.id) {
                  <button type="button" class="btn-secondary min-h-11" [class.text-accent]="liked()" (click)="toggleLike()">
                    <svg lucideHeart [size]="16" [class.fill-accent]="liked()" />
                    {{ likeCount() }}
                  </button>
                }
              }
            </div>
            <div class="mt-4 flex flex-wrap gap-4 text-sm">
              @if (media.imdbLink) {
                <a [href]="media.imdbLink" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center gap-1 text-accent hover:underline">
                  <svg lucideExternalLink [size]="14" /> {{ 'movie.imdb' | translate }}
                </a>
              }
              @if (media.letterboxdLink) {
                <a [href]="media.letterboxdLink" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center gap-1 text-accent hover:underline">
                  <svg lucideExternalLink [size]="14" /> {{ 'movie.letterboxd' | translate }}
                </a>
              }
            </div>
          </div>
        </section>
        @if (credits().cast.length) {
          <section>
            <h2 class="mb-3 text-lg font-semibold">{{ 'movie.cast' | translate }}</h2>
            <div class="chip-row">
              @for (name of credits().cast; track name) {
                <span class="shrink-0 rounded-full border border-border px-3 py-2 text-sm">{{ name }}</span>
              }
            </div>
          </section>
        }
        @if (credits().tracks.length) {
          <section>
            <h2 class="mb-3 text-lg font-semibold">{{ 'movie.tracks' | translate }}</h2>
            <ol class="card list-decimal space-y-1 pl-8 text-sm">
              @for (track of credits().tracks; track track) {
                <li>{{ track }}</li>
              }
            </ol>
          </section>
        }
        <section>
          <h2 class="mb-4 text-lg font-semibold">{{ 'movie.reviewsTitle' | translate }}</h2>
          @if (reviews().length === 0) {
            <app-empty-state [message]="'movie.reviewsEmptyMessage' | translate" [hint]="'movie.reviewsEmptyHint' | translate" />
          } @else {
            <div class="space-y-4">
              @for (review of reviews(); track review.id) {
                <app-review-card [review]="review" (deleted)="loadReviews()" (updated)="loadReviews()" />
              }
            </div>
          }
        </section>
      </div>
    } @else if (loading()) {
      <div class="space-y-4">
        <div class="skeleton h-48 w-full"></div>
        <div class="skeleton h-8 w-1/2"></div>
        <div class="skeleton h-4 w-full"></div>
      </div>
    }

    <app-write-review-modal
      [open]="reviewModalOpen()"
      [preselectedTmdbId]="item()?.tmdbId"
      [preselectedExternalKey]="item()?.externalKey"
      [preselectedMediaType]="item()?.mediaType"
      [preselectedTitle]="item()?.title"
      (closed)="reviewModalOpen.set(false)"
      (submitted)="loadReviews()"
    />
  `,
})
export class MediaDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly movieService = inject(MovieService);
  private readonly mediaService = inject(MediaService);
  private readonly reviewService = inject(ReviewService);
  private readonly listService = inject(ListService);
  private readonly reactionService = inject(ReactionService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);

  item = signal<MediaItem | null>(null);
  credits = signal<MediaCredits>({ cast: [], tracks: [] });
  reviews = signal<Review[]>([]);
  loading = signal(true);
  reviewModalOpen = signal(false);
  likeCount = signal(0);
  liked = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => this.loadFromRoute());
    this.route.queryParamMap.subscribe(() => this.loadFromRoute());
  }

  loadReviews(): void {
    const media = this.item();
    if (!media?.id) return;
    this.reviewService.getByMovie(media.id).subscribe((reviews) => this.reviews.set(reviews));
  }

  addToWatchlist(): void {
    const media = this.item();
    if (!media?.tmdbId) return;
    this.listService.getWatchlist().subscribe((watchlist) => {
      this.listService.addMovie(watchlist.id, media.tmdbId!).subscribe({
        next: () => this.toast.success(this.i18n.translate('movie.addedToWatchlist')),
        error: () => this.toast.error(this.i18n.translate('movie.couldNotAddToWatchlist')),
      });
    });
  }

  toggleLike(): void {
    const media = this.item();
    if (!media?.id) return;
    this.reactionService.toggle('movie', media.id).subscribe((reactions) => {
      this.likeCount.set(this.reactionService.getLikeCount(reactions));
      this.liked.set(this.reactionService.isLikedByCurrentUser(reactions));
    });
  }

  private loadFromRoute(): void {
    const tmdbId = this.route.snapshot.paramMap.get('tmdbId');
    const id = this.route.snapshot.paramMap.get('id');
    const key = this.route.snapshot.queryParamMap.get('key');
    const type = (this.route.snapshot.queryParamMap.get('type') ?? 'FILM') as MediaType;
    this.loading.set(true);
    if (tmdbId) {
      this.movieService.getMovieByTmdbId(Number(tmdbId)).subscribe({
        next: (movie) => this.finish(movie),
        error: () => this.loading.set(false),
      });
      return;
    }
    if (key) {
      this.mediaService.resolve(type, key).subscribe({
        next: (movie) => this.finish(movie),
        error: () => this.loading.set(false),
      });
      return;
    }
    if (id) {
      this.movieService.getMovieById(Number(id)).subscribe({
        next: (movie) => this.finish(movie),
        error: () => this.loading.set(false),
      });
    }
  }

  private finish(movie: MediaItem): void {
    this.item.set(movie);
    this.loading.set(false);
    this.loadReviews();
    this.loadCredits(movie);
    if (movie.id) {
      this.reactionService.getMovieReactions(movie.id).subscribe((reactions) => {
        this.likeCount.set(this.reactionService.getLikeCount(reactions));
        this.liked.set(this.reactionService.isLikedByCurrentUser(reactions));
      });
    }
  }

  private loadCredits(movie: MediaItem): void {
    const type = movie.mediaType ?? 'FILM';
    const key = type === 'FILM' && movie.tmdbId
      ? String(movie.tmdbId)
      : movie.externalKey?.startsWith('sp:')
        ? movie.externalKey
        : movie.externalKey?.replace(/^(tv:|ol:|mb:|tmdb:)/, '');
    if (!key || type === 'BOOK' || type === 'EPISODE') {
      this.credits.set({ cast: [], tracks: [] });
      return;
    }
    this.mediaService.credits(type, key).subscribe({
      next: (credits) => this.credits.set(credits ?? { cast: [], tracks: [] }),
      error: () => this.credits.set({ cast: [], tracks: [] }),
    });
  }
}
