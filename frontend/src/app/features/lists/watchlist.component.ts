import { Component, inject, signal } from '@angular/core';
import { LucideBookmark } from '@lucide/angular';
import { ListService } from '../../core/services/list.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { Movie } from '../../core/models/movie.model';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [TranslatePipe, LucideBookmark, MovieCardComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">{{ 'watchlist.title' | translate }}</h1>
        <p class="text-muted">{{ 'watchlist.subtitle' | translate }}</p>
      </div>

      @if (movies().length === 0 && !loading()) {
        <app-empty-state
          [message]="'watchlist.emptyMessage' | translate"
          [hint]="'watchlist.emptyHint' | translate"
        >
          <svg emptyIcon lucideBookmark [size]="48" class="mb-4 text-muted" />
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          @for (movie of movies(); track movie.id) {
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
                (click)="remove(movie)"
              >
                {{ 'common.remove' | translate }}
              </button>
            </div>
          }
        </div>
      }
      @if (loading()) {
        <p class="text-center text-muted">{{ 'common.loading' | translate }}</p>
      }
    </div>
  `,
})
export class WatchlistComponent {
  private readonly listService = inject(ListService);
  private readonly toast = inject(ToastService);
  private readonly translationService = inject(TranslationService);

  movies = signal<Movie[]>([]);
  private listId = 0;
  loading = signal(true);

  ngOnInit(): void {
    this.listService.getWatchlist().subscribe({
      next: (list) => {
        this.listId = list.id;
        this.movies.set(list.movies ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(movie: Movie): void {
    this.listService.removeMovie(this.listId, movie.id).subscribe({
      next: () => {
        this.movies.update((m) => m.filter((x) => x.id !== movie.id));
        this.toast.success(this.translationService.translate('watchlist.removed'));
      },
      error: () => this.toast.error(this.translationService.translate('watchlist.couldNotRemove')),
    });
  }
}
