import { Component, inject, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { LucideSearch } from '@lucide/angular';

import { MovieService } from '../../core/services/movie.service';

import { Movie } from '../../core/models/movie.model';

import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';

import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

import { TranslatePipe } from '../../core/pipes/translate.pipe';



@Component({
    selector: 'app-explore',
    imports: [
        FormsModule,
        TranslatePipe,
        LucideSearch,
        MovieCardComponent,
        EmptyStateComponent,
    ],
    template: `

    <div class="space-y-8">

      <header class="page-header !mb-0">

        <h1 class="page-title">{{ 'explore.title' | translate }}</h1>

        <p class="page-subtitle">{{ 'explore.subtitle' | translate }}</p>

      </header>



      <form class="relative max-w-xl" (submit)="onSearch($event)">

        <svg

          lucideSearch

          [size]="18"

          class="absolute left-3 top-1/2 -translate-y-1/2 text-muted"

        />

        <input

          type="search"

          class="input-field pl-10"

          [placeholder]="'common.searchMovies' | translate"

          [(ngModel)]="query"

          name="q"

        />

      </form>



      <section>

        <div class="section-heading">

          <h2 class="section-title">

            {{ (query.trim() ? 'explore.searchResults' : 'explore.popularMovies') | translate }}

          </h2>

          @if (movies().length) {

            <span class="text-sm text-muted">{{ 'explore.titleCount' | translate: { count: movies().length } }}</span>

          }

        </div>

        @if (movies().length === 0 && !loading()) {

          <app-empty-state

            [message]="'explore.emptyMessage' | translate"

            [hint]="'explore.emptyHint' | translate"

          >

            <svg emptyIcon lucideSearch [size]="28" />

          </app-empty-state>

        } @else if (loading() && movies().length === 0) {

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

            @for (i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track i) {

              <div class="space-y-2">

                <div class="skeleton aspect-[2/3] w-full"></div>

                <div class="skeleton h-3 w-3/4"></div>

              </div>

            }

          </div>

        } @else {

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

            @for (movie of movies(); track movie.id) {

              <app-movie-card

                [movieId]="movie.id"

                [title]="movie.title"

                [year]="movie.year"

                [posterUrl]="movie.posterApiLink"

              />

            }

          </div>

        }

        @if (loading() && movies().length > 0) {

          <p class="py-8 text-center text-sm text-muted">{{ 'common.loading' | translate }}</p>

        }

      </section>

    </div>

  `
})

export class ExploreComponent {

  private readonly movieService = inject(MovieService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);



  query = '';

  movies = signal<Movie[]>([]);

  loading = signal(false);



  ngOnInit(): void {

    this.route.queryParams.subscribe((params) => {

      this.query = params['q'] ?? '';

      this.loadMovies();

    });

  }



  onSearch(event: Event): void {

    event.preventDefault();

    this.router.navigate([], {

      relativeTo: this.route,

      queryParams: { q: this.query.trim() || null },

    });

  }



  private loadMovies(): void {

    this.loading.set(true);

    const request = this.query.trim()

      ? this.movieService.searchMovies(this.query.trim())

      : this.movieService.getPopularMovies();



    request.subscribe({

      next: (movies) => {

        this.movies.set(movies);

        this.loading.set(false);

      },

      error: () => this.loading.set(false),

    });

  }

}

