import { Component, effect, inject, input, output, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MovieService } from '../../../core/services/movie.service';

import { ReviewService } from '../../../core/services/review.service';

import { ToastService } from '../../../core/services/toast.service';

import { TranslationService } from '../../../core/services/translation.service';

import { Movie } from '../../../core/models/movie.model';

import { ModalComponent } from '../modal/modal.component';

import { StarRatingComponent } from '../star-rating/star-rating.component';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';



@Component({
    selector: 'app-write-review-modal',
    imports: [FormsModule, TranslatePipe, ModalComponent, StarRatingComponent],
    template: `

    <app-modal [open]="open()" [title]="'reviewModal.title' | translate" (closed)="closed.emit()">

      <div class="space-y-4">

        @if (!selectedMovie()) {

          <div>

            <label class="mb-1 block text-sm text-muted">{{ 'reviewModal.searchMovie' | translate }}</label>

            <input

              type="text"

              class="input-field"

              [placeholder]="'reviewModal.searchPlaceholder' | translate"

              [ngModel]="searchQuery()"

              (ngModelChange)="onSearch($event)"

            />

            @if (searchResults().length) {

              <ul class="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border">

                @for (movie of searchResults(); track movie.tmdbId ?? movie.id) {

                  <li>

                    <button

                      type="button"

                      class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-elevated"

                      (click)="selectMovie(movie)"

                    >

                      @if (movie.posterApiLink) {

                        <img

                          [src]="movie.posterApiLink"

                          [alt]="movie.title"

                          class="h-12 w-8 rounded object-cover"

                        />

                      }

                      <span class="text-sm">{{ movie.title }} ({{ movie.year }})</span>

                    </button>

                  </li>

                }

              </ul>

            }

          </div>

        } @else {

          <div class="flex items-center gap-3 rounded-lg bg-elevated p-3">

            @if (selectedMovie()!.posterApiLink) {

              <img

                [src]="selectedMovie()!.posterApiLink"

                [alt]="selectedMovie()!.title"

                class="h-16 w-11 rounded object-cover"

              />

            }

            <div>

              <p class="font-medium">{{ selectedMovie()!.title }}</p>

              <button

                type="button"

                class="text-xs text-accent hover:underline"

                (click)="selectedMovie.set(null)"

              >

                {{ 'reviewModal.changeMovie' | translate }}

              </button>

            </div>

          </div>



          <div>

            <label class="mb-1 block text-sm text-muted">{{ 'reviewModal.rating' | translate }}</label>

            <app-star-rating

              mode="input"

              [value]="rating()"

              (valueChange)="rating.set($event)"

            />

          </div>



          <div>

            <label class="mb-1 block text-sm text-muted">{{ 'reviewModal.dateWatched' | translate }}</label>

            <input type="date" class="input-field" [(ngModel)]="dateWatched" />

          </div>



          <label class="flex items-center gap-2 text-sm">

            <input type="checkbox" [(ngModel)]="spoiler" />

            {{ 'reviewModal.spoiler' | translate }}

          </label>



          <div>

            <label class="mb-1 block text-sm text-muted">{{ 'reviewModal.review' | translate }}</label>

            <textarea

              class="input-field min-h-[100px] resize-y"

              rows="4"

              [placeholder]="'reviewModal.reviewPlaceholder' | translate"

              [(ngModel)]="text"

            ></textarea>

          </div>



          <button

            type="button"

            class="btn-primary w-full"

            [disabled]="submitting() || !selectedMovie() || !rating()"

            (click)="submit()"

          >

            {{ (submitting() ? 'reviewModal.submitting' : 'reviewModal.submit') | translate }}

          </button>

        }

      </div>

    </app-modal>

  `
})

export class WriteReviewModalComponent {

  open = input(false);

  preselectedTmdbId = input<number>();
  preselectedExternalKey = input<string>();
  preselectedMediaType = input<string>();
  preselectedTitle = input<string>();

  closed = output<void>();

  submitted = output<void>();



  private readonly movieService = inject(MovieService);

  private readonly reviewService = inject(ReviewService);

  private readonly toast = inject(ToastService);

  private readonly translationService = inject(TranslationService);



  searchQuery = signal('');

  searchResults = signal<Movie[]>([]);

  selectedMovie = signal<Movie | null>(null);

  rating = signal(0);

  submitting = signal(false);



  dateWatched = '';

  spoiler = false;

  text = '';



  constructor() {

    effect(() => {

      if (!this.open()) {
        return;
      }
      const title = this.preselectedTitle();
      const externalKey = this.preselectedExternalKey();
      if (title && (externalKey || this.preselectedTmdbId())) {
        this.selectedMovie.set({
          title,
          tmdbId: this.preselectedTmdbId(),
          externalKey,
          mediaType: (this.preselectedMediaType() as Movie['mediaType']) ?? 'FILM',
        });
        return;
      }
      const tmdbId = this.preselectedTmdbId();
      if (tmdbId) {
        this.movieService.getMovieByTmdbId(tmdbId).subscribe((movie) => {
          this.selectedMovie.set(movie);
        });
      }

    });

  }



  onSearch(query: string): void {

    this.searchQuery.set(query);

    if (query.trim().length < 2) {

      this.searchResults.set([]);

      return;

    }

    this.movieService.searchMovies(query).subscribe((movies) => {

      this.searchResults.set(movies);

    });

  }



  selectMovie(movie: Movie): void {

    this.selectedMovie.set(movie);

    this.searchResults.set([]);

  }



  submit(): void {

    const movie = this.selectedMovie();

    if ((!movie?.tmdbId && !movie?.externalKey) || !this.rating()) {
      return;
    }

    this.submitting.set(true);

    this.reviewService

      .create({

        tmdbId: movie.tmdbId,

        externalKey: movie.externalKey,

        mediaType: movie.mediaType,

        rating: this.rating(),

        text: this.text || undefined,

        dateWatched: this.dateWatched || undefined,

        spoiler: this.spoiler,

      })

      .subscribe({

        next: () => {

          this.toast.success(this.translationService.translate('reviewModal.published'));

          this.submitting.set(false);

          this.reset();

          this.submitted.emit();

          this.closed.emit();

        },

        error: () => {

          this.toast.error(this.translationService.translate('reviewModal.failed'));

          this.submitting.set(false);

        },

      });

  }



  private reset(): void {

    this.selectedMovie.set(null);

    this.rating.set(0);

    this.text = '';

    this.dateWatched = '';

    this.spoiler = false;

    this.searchQuery.set('');

  }

}

