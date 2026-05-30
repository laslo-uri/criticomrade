import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { LucideGift } from '@lucide/angular';

import { RecommendationService } from '../../core/services/recommendation.service';

import { MovieService } from '../../core/services/movie.service';

import { ToastService } from '../../core/services/toast.service';

import { TranslationService } from '../../core/services/translation.service';

import { Recommendation } from '../../core/models/recommendation.model';

import { Movie } from '../../core/models/movie.model';

import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

import { TranslatePipe } from '../../core/pipes/translate.pipe';



type RecTab = 'incoming' | 'outgoing';



@Component({

  selector: 'app-recommendations',

  standalone: true,

  imports: [FormsModule, TranslatePipe, LucideGift, EmptyStateComponent],

  template: `

    <div class="space-y-6">

      <div>

        <h1 class="text-2xl font-semibold">{{ 'recommendations.title' | translate }}</h1>

        <p class="text-muted">{{ 'recommendations.subtitle' | translate }}</p>

      </div>



      <div class="flex gap-2 border-b border-border">

        <button

          type="button"

          class="px-4 py-2 text-sm"

          [class.border-b-2]="tab() === 'incoming'"

          [class.border-accent]="tab() === 'incoming'"

          [class.text-accent]="tab() === 'incoming'"

          [class.text-muted]="tab() !== 'incoming'"

          (click)="setTab('incoming')"

        >

          {{ 'recommendations.tabIncoming' | translate }}

        </button>

        <button

          type="button"

          class="px-4 py-2 text-sm"

          [class.border-b-2]="tab() === 'outgoing'"

          [class.border-accent]="tab() === 'outgoing'"

          [class.text-accent]="tab() === 'outgoing'"

          [class.text-muted]="tab() !== 'outgoing'"

          (click)="setTab('outgoing')"

        >

          {{ 'recommendations.tabOutgoing' | translate }}

        </button>

      </div>



      <form class="card space-y-3" (submit)="create($event)">

        <h3 class="font-medium">{{ 'recommendations.sendTitle' | translate }}</h3>

        <input

          type="text"

          class="input-field"

          [placeholder]="'recommendations.friendUsername' | translate"

          [(ngModel)]="toUsername"

          name="to"

          required

        />

        <input

          type="text"

          class="input-field"

          [placeholder]="'recommendations.searchMovie' | translate"

          [(ngModel)]="movieQuery"

          name="movieQuery"

          (ngModelChange)="searchMovies($event)"

        />

        @if (movieResults().length) {

          <ul class="max-h-32 overflow-y-auto rounded border border-border">

            @for (m of movieResults(); track m.tmdbId ?? m.id) {

              <li>

                <button type="button" class="w-full px-3 py-2 text-left text-sm hover:bg-elevated" (click)="selectMovie(m)">

                  {{ m.title }} ({{ m.year }})

                </button>

              </li>

            }

          </ul>

        }

        @if (selectedMovie()) {

          <p class="text-sm text-muted">{{ 'recommendations.selected' | translate: { title: selectedMovie()!.title } }}</p>

        }

        <div class="grid grid-cols-2 gap-3">

          <div>

            <label class="mb-1 block text-xs text-muted">{{ 'recommendations.days' | translate }}</label>

            <input type="number" class="input-field" [(ngModel)]="durationDays" name="days" min="1" />

          </div>

          <div>

            <label class="mb-1 block text-xs text-muted">{{ 'recommendations.points' | translate }}</label>

            <input type="number" class="input-field" [(ngModel)]="points" name="points" min="0" />

          </div>

        </div>

        <button type="submit" class="btn-primary" [disabled]="!selectedMovie() || !toUsername">{{ 'common.send' | translate }}</button>

      </form>



      @if (items().length === 0 && !loading()) {

        <app-empty-state [message]="'recommendations.emptyMessage' | translate">

          <svg emptyIcon lucideGift [size]="48" class="mb-4 text-muted" />

        </app-empty-state>

      } @else {

        <ul class="space-y-3">

          @for (rec of items(); track rec.id) {

            <li class="card">

              <div class="flex items-start justify-between gap-4">

                <div>

                  <p class="font-medium">{{ rec.movie.title }}</p>

                  <p class="text-sm text-muted">

                    @if (tab() === 'incoming') {

                      {{ 'recommendations.fromUser' | translate: { username: rec.fromUser.username } }}

                    } @else {

                      {{ 'recommendations.toUser' | translate: { username: rec.toUser.username } }}

                    }

                    · {{ rec.status }}

                  </p>

                  <p class="text-xs text-muted">{{

                    'recommendations.meta' | translate: { points: rec.challengePoints, days: rec.challengeDurationDays }

                  }}</p>

                </div>

                <div class="flex shrink-0 gap-2">

                  @if (tab() === 'incoming' && rec.status === 'PENDING') {

                    <button type="button" class="btn-primary text-xs" (click)="accept(rec)">{{ 'recommendations.accept' | translate }}</button>

                    <button type="button" class="btn-secondary text-xs" (click)="reject(rec)">{{ 'recommendations.reject' | translate }}</button>

                  }

                  @if (rec.status === 'ACCEPTED') {

                    <button type="button" class="btn-secondary text-xs" (click)="complete(rec)">{{ 'recommendations.complete' | translate }}</button>

                  }

                </div>

              </div>

            </li>

          }

        </ul>

      }

      @if (loading()) {

        <p class="text-center text-muted">{{ 'common.loading' | translate }}</p>

      }

    </div>

  `,

})

export class RecommendationsComponent {

  private readonly recommendationService = inject(RecommendationService);

  private readonly movieService = inject(MovieService);

  private readonly toast = inject(ToastService);

  private readonly translationService = inject(TranslationService);



  tab = signal<RecTab>('incoming');

  items = signal<Recommendation[]>([]);

  loading = signal(true);



  toUsername = '';

  movieQuery = '';

  movieResults = signal<Movie[]>([]);

  selectedMovie = signal<Movie | null>(null);

  durationDays = 7;

  points = 10;



  ngOnInit(): void {

    this.load();

  }



  setTab(tab: RecTab): void {

    this.tab.set(tab);

    this.load();

  }



  searchMovies(query: string): void {

    if (query.trim().length < 2) {

      this.movieResults.set([]);

      return;

    }

    this.movieService.searchMovies(query).subscribe((m) => this.movieResults.set(m));

  }



  selectMovie(movie: Movie): void {

    this.selectedMovie.set(movie);

    this.movieResults.set([]);

    this.movieQuery = movie.title;

  }



  create(event: Event): void {

    event.preventDefault();

    const movie = this.selectedMovie();

    if (!movie?.tmdbId || !this.toUsername.trim()) return;

    this.recommendationService

      .create({

        toUsername: this.toUsername.trim(),

        tmdbId: movie.tmdbId,

        challengeDurationDays: this.durationDays,

        challengePoints: this.points,

      })

      .subscribe({

        next: () => {

          this.toast.success(this.translationService.translate('recommendations.sent'));

          this.toUsername = '';

          this.selectedMovie.set(null);

          this.movieQuery = '';

          if (this.tab() === 'outgoing') this.load();

        },

        error: () => this.toast.error(this.translationService.translate('recommendations.sendFailed')),

      });

  }



  accept(rec: Recommendation): void {

    this.recommendationService.accept(rec.id).subscribe({

      next: () => {

        this.toast.success(this.translationService.translate('recommendations.accepted'));

        this.load();

      },

      error: () => this.toast.error(this.translationService.translate('recommendations.failed')),

    });

  }



  reject(rec: Recommendation): void {

    this.recommendationService.reject(rec.id).subscribe({

      next: () => {

        this.toast.success(this.translationService.translate('recommendations.rejected'));

        this.load();

      },

      error: () => this.toast.error(this.translationService.translate('recommendations.failed')),

    });

  }



  complete(rec: Recommendation): void {

    this.recommendationService.complete(rec.id).subscribe({

      next: () => {

        this.toast.success(this.translationService.translate('recommendations.markedComplete'));

        this.load();

      },

      error: () => this.toast.error(this.translationService.translate('recommendations.failed')),

    });

  }



  private load(): void {

    this.loading.set(true);

    const request =

      this.tab() === 'incoming'

        ? this.recommendationService.getIncoming()

        : this.recommendationService.getOutgoing();

    request.subscribe({

      next: (items) => {

        this.items.set(items);

        this.loading.set(false);

      },

      error: () => this.loading.set(false),

    });

  }

}

