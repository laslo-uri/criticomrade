import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  LucideExternalLink,
  LucideHeart,
  LucidePenLine,
} from '@lucide/angular';
import { MovieService } from '../../core/services/movie.service';
import { ReviewService } from '../../core/services/review.service';
import { ListService } from '../../core/services/list.service';
import { ReactionService } from '../../core/services/reaction.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { Movie } from '../../core/models/movie.model';
import { Review } from '../../core/models/review.model';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { WriteReviewModalComponent } from '../../shared/components/write-review-modal/write-review-modal.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
    selector: 'app-movie-detail',
    imports: [
        TranslatePipe,
        LucidePenLine,
        LucideHeart,
        LucideExternalLink,
        ReviewCardComponent,
        EmptyStateComponent,
        WriteReviewModalComponent,
    ],
    template: `
    @if (movie()) {
      <div class="space-y-8">
        <section class="flex flex-col gap-6 md:flex-row">
          <div class="mx-auto w-48 shrink-0 md:mx-0 md:w-56">
            @if (movie()!.posterApiLink) {
              <img
                [src]="movie()!.posterApiLink"
                [alt]="movie()!.title"
                class="w-full rounded-xl shadow-2xl"
              />
            }
          </div>
          <div class="flex-1">
            <h1 class="text-3xl font-bold">{{ movie()!.title }}</h1>
            @if (movie()!.year) {
              <p class="mt-1 text-muted">{{ movie()!.year }}</p>
            }
            @if (movie()!.genre) {
              <p class="mt-2 text-sm text-muted">{{ movie()!.genre }}</p>
            }
            @if (movie()!.description) {
              <p class="mt-4 leading-relaxed text-text/90">{{ movie()!.description }}</p>
            }

            <div class="mt-6 flex flex-wrap gap-3">
              @if (auth.isLoggedIn()) {
                <button type="button" class="btn-primary" (click)="reviewModalOpen.set(true)">
                  <svg lucidePenLine [size]="16" />
                  {{ 'movie.writeReview' | translate }}
                </button>
                <button type="button" class="btn-secondary" (click)="addToWatchlist()">
                  {{ 'movie.addToWatchlist' | translate }}
                </button>
                <button
                  type="button"
                  class="btn-secondary"
                  [class.text-accent]="movieLiked()"
                  (click)="toggleMovieLike()"
                >
                  <svg lucideHeart [size]="16" [class.fill-accent]="movieLiked()" />
                  {{ movieLikeCount() }}
                </button>
              }
            </div>

            <div class="mt-4 flex flex-wrap gap-4 text-sm">
              @if (movie()!.imdbLink) {
                <a [href]="movie()!.imdbLink" target="_blank" rel="noopener" class="flex items-center gap-1 text-accent hover:underline">
                  <svg lucideExternalLink [size]="14" /> {{ 'movie.imdb' | translate }}
                </a>
              }
              @if (movie()!.letterboxdLink) {
                <a [href]="movie()!.letterboxdLink" target="_blank" rel="noopener" class="flex items-center gap-1 text-accent hover:underline">
                  <svg lucideExternalLink [size]="14" /> {{ 'movie.letterboxd' | translate }}
                </a>
              }
              @if (movie()!.youtubeTrailerLink) {
                <a [href]="movie()!.youtubeTrailerLink" target="_blank" rel="noopener" class="flex items-center gap-1 text-accent hover:underline">
                  <svg lucideExternalLink [size]="14" /> {{ 'movie.trailer' | translate }}
                </a>
              }
            </div>
          </div>
        </section>

        <section>
          <h2 class="mb-4 text-lg font-semibold">{{ 'movie.reviewsTitle' | translate }}</h2>
          @if (reviews().length === 0) {
            <app-empty-state
              [message]="'movie.reviewsEmptyMessage' | translate"
              [hint]="'movie.reviewsEmptyHint' | translate"
            />
          } @else {
            <div class="space-y-4">
              @for (review of reviews(); track review.id) {
                <app-review-card [review]="review" />
              }
            </div>
          }
        </section>
      </div>
    } @else if (loading()) {
      <p class="py-16 text-center text-muted">{{ 'common.loading' | translate }}</p>
    }

    <app-write-review-modal
      [open]="reviewModalOpen()"
      [preselectedTmdbId]="movie()?.tmdbId"
      (closed)="reviewModalOpen.set(false)"
      (submitted)="loadReviews()"
    />
  `
})
export class MovieDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly movieService = inject(MovieService);
  private readonly reviewService = inject(ReviewService);
  private readonly listService = inject(ListService);
  private readonly reactionService = inject(ReactionService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translationService = inject(TranslationService);

  movie = signal<Movie | null>(null);
  reviews = signal<Review[]>([]);
  loading = signal(true);
  reviewModalOpen = signal(false);
  movieLikeCount = signal(0);
  movieLiked = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadMovie(id);
      }
    });
  }

  loadReviews(): void {
    const movie = this.movie();
    if (!movie) return;
    this.reviewService.getByMovie(movie.id).subscribe((reviews) => {
      this.reviews.set(reviews);
    });
  }

  addToWatchlist(): void {
    const movie = this.movie();
    if (!movie?.tmdbId) return;
    this.listService.getWatchlist().subscribe((watchlist) => {
      this.listService.addMovie(watchlist.id, movie.tmdbId!).subscribe({
        next: () => this.toast.success(this.translationService.translate('movie.addedToWatchlist')),
        error: () => this.toast.error(this.translationService.translate('movie.couldNotAddToWatchlist')),
      });
    });
  }

  toggleMovieLike(): void {
    const movie = this.movie();
    if (!movie) return;
    this.reactionService.toggle('movie', movie.id).subscribe((reactions) => {
      this.movieLikeCount.set(this.reactionService.getLikeCount(reactions));
      this.movieLiked.set(this.reactionService.isLikedByCurrentUser(reactions));
    });
  }

  private loadMovie(id: number): void {
    this.loading.set(true);
    this.movieService.getMovieById(id).subscribe({
      next: (movie) => {
        this.movie.set(movie);
        this.loading.set(false);
        this.loadReviews();
        this.reactionService.getMovieReactions(id).subscribe((reactions) => {
          this.movieLikeCount.set(this.reactionService.getLikeCount(reactions));
          this.movieLiked.set(this.reactionService.isLikedByCurrentUser(reactions));
        });
      },
      error: () => this.loading.set(false),
    });
  }
}
