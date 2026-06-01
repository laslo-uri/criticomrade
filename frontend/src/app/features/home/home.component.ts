import {

  AfterViewInit,

  Component,

  ElementRef,

  inject,

  OnDestroy,

  OnInit,

  signal,

  viewChild,

} from '@angular/core';

import { RouterLink } from '@angular/router';

import { LucideChevronRight, LucideCompass, LucideFilm, LucidePenLine } from '@lucide/angular';

import { ReviewService } from '../../core/services/review.service';

import { MovieService } from '../../core/services/movie.service';

import { AuthService } from '../../core/services/auth.service';

import { TranslationService } from '../../core/services/translation.service';

import { Review } from '../../core/models/review.model';

import { Movie } from '../../core/models/movie.model';

import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';

import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';

import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

import { WriteReviewModalComponent } from '../../shared/components/write-review-modal/write-review-modal.component';

import { TranslatePipe } from '../../core/pipes/translate.pipe';



@Component({
    selector: 'app-home',
    imports: [
        RouterLink,
        TranslatePipe,
        LucidePenLine,
        LucideFilm,
        LucideCompass,
        LucideChevronRight,
        ReviewCardComponent,
        MovieCardComponent,
        EmptyStateComponent,
        WriteReviewModalComponent,
    ],
    template: `

    <header class="page-header">

      <h1 class="page-title">{{ greeting() }}</h1>

      <p class="page-subtitle">{{ 'home.subtitle' | translate }}</p>

    </header>



    <div class="space-y-10">

      <section>

        <button type="button" class="prompt-card group" (click)="reviewModalOpen.set(true)">

          <div

            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent transition group-hover:bg-accent/25"

          >

            <svg lucidePenLine [size]="22" />

          </div>

          <div class="min-w-0 flex-1">

            <p class="font-semibold text-text">{{ 'home.promptTitle' | translate }}</p>

            <p class="mt-0.5 text-sm text-muted">{{ 'home.promptSubtitle' | translate }}</p>

          </div>

          <svg

            lucideChevronRight

            [size]="20"

            class="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"

          />

        </button>

      </section>



      @if (popularMovies().length) {

        <section>

          <div class="section-heading">

            <h2 class="section-title">{{ 'home.popularTitle' | translate }}</h2>

            <a routerLink="/explore" class="text-sm font-medium text-accent hover:underline">{{ 'home.seeAll' | translate }}</a>

          </div>

          <div class="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            @for (movie of popularMovies(); track movie.id) {

              <div class="w-32 shrink-0">

                <app-movie-card

                  [movieId]="movie.id"

                  [title]="movie.title"

                  [year]="movie.year"

                  [posterUrl]="movie.posterApiLink"

                />

              </div>

            }

          </div>

        </section>

      }



      <section>

        <div class="section-heading">

          <h2 class="section-title">{{ 'home.feedTitle' | translate }}</h2>

          @if (reviews().length) {

            <span class="text-sm text-muted">{{

              reviews().length === 1

                ? ('home.reviewCount' | translate: { count: reviews().length })

                : ('home.reviewsCount' | translate: { count: reviews().length })

            }}</span>

          }

        </div>



        @if (loading() && reviews().length === 0) {

          <div class="space-y-4">

            @for (i of [1, 2, 3]; track i) {

              <div class="card flex gap-4">

                <div class="skeleton h-24 w-16 shrink-0"></div>

                <div class="flex-1 space-y-3 py-1">

                  <div class="skeleton h-4 w-1/3"></div>

                  <div class="skeleton h-3 w-1/4"></div>

                  <div class="skeleton h-3 w-full"></div>

                  <div class="skeleton h-3 w-2/3"></div>

                </div>

              </div>

            }

          </div>

        } @else if (reviews().length === 0) {

          <app-empty-state

            [message]="'home.emptyMessage' | translate"

            [hint]="'home.emptyHint' | translate"

          >

            <svg emptyIcon lucideFilm [size]="28" />

            <button type="button" class="btn-primary" (click)="reviewModalOpen.set(true)">

              {{ 'home.writeReview' | translate }}

            </button>

            <a routerLink="/explore" class="btn-secondary">

              <svg lucideCompass [size]="16" />

              {{ 'home.exploreMovies' | translate }}

            </a>

          </app-empty-state>

        } @else {

          <div class="space-y-4">

            @for (review of reviews(); track review.id) {

              <app-review-card [review]="review" />

            }

          </div>

          <div #sentinel class="h-4"></div>

          @if (loading()) {

            <p class="py-6 text-center text-sm text-muted">{{ 'common.loadingMore' | translate }}</p>

          }

        }

      </section>

    </div>



    <app-write-review-modal

      [open]="reviewModalOpen()"

      (closed)="reviewModalOpen.set(false)"

      (submitted)="reloadFeed()"

    />

  `
})

export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  private readonly reviewService = inject(ReviewService);

  private readonly movieService = inject(MovieService);

  private readonly auth = inject(AuthService);

  private readonly i18n = inject(TranslationService);



  reviews = signal<Review[]>([]);

  popularMovies = signal<Movie[]>([]);

  loading = signal(false);

  reviewModalOpen = signal(false);

  private page = 0;

  private hasMore = true;

  private observer?: IntersectionObserver;



  sentinel = viewChild<ElementRef>('sentinel');



  greeting(): string {

    const name = this.auth.currentUser()?.fullName?.split(' ')[0]

      ?? this.auth.currentUser()?.username;

    const hour = new Date().getHours();

    const timeKey =

      hour < 12 ? 'home.greetingMorning' : hour < 18 ? 'home.greetingAfternoon' : 'home.greetingEvening';

    const time = this.i18n.translate(timeKey);

    return name

      ? this.i18n.translate('home.greetingNamed', { time, name })

      : this.i18n.translate('home.greetingDefault');

  }



  ngOnInit(): void {

    this.loadPopular();

    this.loadFeed();

  }



  ngAfterViewInit(): void {

    this.observer = new IntersectionObserver(

      (entries) => {

        if (entries[0]?.isIntersecting && this.hasMore && !this.loading()) {

          this.loadFeed();

        }

      },

      { rootMargin: '200px' }

    );

    const el = this.sentinel()?.nativeElement;

    if (el) {

      this.observer.observe(el);

    }

  }



  ngOnDestroy(): void {

    this.observer?.disconnect();

  }



  reloadFeed(): void {

    this.page = 0;

    this.hasMore = true;

    this.reviews.set([]);

    this.loadFeed();

  }



  private loadPopular(): void {

    this.movieService.getPopularMovies().subscribe((movies) => {

      this.popularMovies.set(movies.slice(0, 10));

    });

  }



  private loadFeed(): void {

    if (!this.hasMore) return;

    this.loading.set(true);

    this.reviewService.getFeed(this.page).subscribe({

      next: (items) => {

        if (items.length < 20) {

          this.hasMore = false;

        }

        this.reviews.update((prev) => [...prev, ...items]);

        this.page++;

        this.loading.set(false);

      },

      error: () => this.loading.set(false),

    });

  }

}

