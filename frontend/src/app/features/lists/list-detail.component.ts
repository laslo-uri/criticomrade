import { Component, inject, signal } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { LucideSearch } from '@lucide/angular';

import { ListService } from '../../core/services/list.service';

import { MovieService } from '../../core/services/movie.service';

import { ToastService } from '../../core/services/toast.service';

import { TranslationService } from '../../core/services/translation.service';

import { MovieList } from '../../core/models/list.model';

import { Movie } from '../../core/models/movie.model';

import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';

import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

import { TranslatePipe } from '../../core/pipes/translate.pipe';



@Component({
    selector: 'app-list-detail',
    imports: [FormsModule, TranslatePipe, LucideSearch, MovieCardComponent, EmptyStateComponent],
    template: `

    @if (list()) {

      <div class="space-y-6">

        <div>

          <h1 class="text-2xl font-semibold">{{ list()!.name }}</h1>

          <p class="text-muted">{{ 'listDetail.filmCount' | translate: { count: list()!.movies?.length ?? 0 } }}</p>

        </div>



        <form class="relative" (submit)="searchMovie($event)">

          <svg lucideSearch [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />

          <input

            type="search"

            class="input-field pl-9"

            [placeholder]="'listDetail.searchPlaceholder' | translate"

            [(ngModel)]="searchQuery"

            name="search"

          />

        </form>

        @if (searchResults().length) {

          <ul class="rounded-lg border border-border">

            @for (movie of searchResults(); track movie.tmdbId ?? movie.id) {

              <li>

                <button

                  type="button"

                  class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-elevated"

                  (click)="addMovie(movie)"

                >

                  @if (movie.posterApiLink) {

                    <img [src]="movie.posterApiLink" [alt]="movie.title" class="h-10 w-7 rounded object-cover" />

                  }

                  <span class="text-sm">{{ movie.title }}</span>

                </button>

              </li>

            }

          </ul>

        }



        @if ((list()!.movies?.length ?? 0) === 0) {

          <app-empty-state

            [message]="'listDetail.emptyMessage' | translate"

            [hint]="'listDetail.emptyHint' | translate"

          />

        } @else {

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

            @for (movie of list()!.movies!; track movie.id) {

              <div class="relative group">

                <app-movie-card

                  [movieId]="movie.id"

                  [title]="movie.title"

                  [year]="movie.year"

                  [posterUrl]="movie.posterApiLink"

                />

                <button

                  type="button"

                  class="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100"

                  (click)="removeMovie(movie)"

                >

                  {{ 'common.remove' | translate }}

                </button>

              </div>

            }

          </div>

        }

      </div>

    } @else if (loading()) {

      <p class="py-16 text-center text-muted">{{ 'common.loading' | translate }}</p>

    }

  `
})

export class ListDetailComponent {

  private readonly route = inject(ActivatedRoute);

  private readonly listService = inject(ListService);

  private readonly movieService = inject(MovieService);

  private readonly toast = inject(ToastService);

  private readonly translationService = inject(TranslationService);



  list = signal<MovieList | null>(null);

  searchResults = signal<Movie[]>([]);

  loading = signal(true);

  searchQuery = '';



  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      const id = Number(params.get('id'));

      if (id) this.loadList(id);

    });

  }



  searchMovie(event: Event): void {

    event.preventDefault();

    if (this.searchQuery.trim().length < 2) return;

    this.movieService.searchMovies(this.searchQuery.trim()).subscribe((movies) => {

      this.searchResults.set(movies);

    });

  }



  addMovie(movie: Movie): void {

    const list = this.list();

    if (!list || !movie.tmdbId) return;

    this.listService.addMovie(list.id, movie.tmdbId).subscribe({

      next: (updated) => {

        this.list.set(updated);

        this.searchResults.set([]);

        this.searchQuery = '';

        this.toast.success(this.translationService.translate('listDetail.movieAdded'));

      },

      error: () => this.toast.error(this.translationService.translate('listDetail.couldNotAddMovie')),

    });

  }



  removeMovie(movie: Movie): void {

    const list = this.list();

    if (!list || movie.id == null) return;

    this.listService.removeMovie(list.id, movie.id).subscribe({

      next: () => {

        this.list.update((l) =>

          l

            ? { ...l, movies: l.movies?.filter((m) => m.id !== movie.id) }

            : l

        );

        this.toast.success(this.translationService.translate('listDetail.removed'));

      },

      error: () => this.toast.error(this.translationService.translate('listDetail.couldNotRemove')),

    });

  }



  private loadList(id: number): void {

    this.loading.set(true);

    this.listService.getById(id).subscribe({

      next: (list) => {

        this.list.set(list);

        this.loading.set(false);

      },

      error: () => this.loading.set(false),

    });

  }

}

