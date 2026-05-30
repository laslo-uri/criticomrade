import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideBookOpen } from '@lucide/angular';
import { ListService } from '../../core/services/list.service';
import { Review } from '../../core/models/review.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LucideBookOpen, EmptyStateComponent, StarRatingComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">{{ 'diary.title' | translate }}</h1>
        <p class="text-muted">{{ 'diary.subtitle' | translate }}</p>
      </div>

      @if (reviews().length === 0 && !loading()) {
        <app-empty-state
          [message]="'diary.emptyMessage' | translate"
          [hint]="'diary.emptyHint' | translate"
        >
          <svg emptyIcon lucideBookOpen [size]="48" class="mb-4 text-muted" />
        </app-empty-state>
      } @else {
        <div class="relative space-y-0">
          <div class="absolute left-4 top-0 bottom-0 w-px bg-elevated"></div>
          @for (review of reviews(); track review.id) {
            <div class="relative flex gap-4 pb-8 pl-10">
              <div class="absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-accent bg-bg"></div>
              <div class="flex-1 card">
                <div class="mb-2 flex items-start justify-between gap-2">
                  <div>
                    @if (review.movie) {
                      <a
                        [routerLink]="['/movies', review.movie.id]"
                        class="font-medium hover:text-accent"
                      >
                        {{ review.movie.title }}
                      </a>
                    }
                    @if (review.dateWatched) {
                      <p class="text-xs text-muted">{{ review.dateWatched }}</p>
                    }
                  </div>
                  @if (review.rating) {
                    <app-star-rating mode="display" [value]="review.rating" />
                  }
                </div>
                @if (review.text) {
                  <p class="text-sm text-text/90">{{ review.text }}</p>
                }
              </div>
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
export class DiaryComponent {
  private readonly listService = inject(ListService);
  reviews = signal<Review[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.listService.getDiary().subscribe({
      next: (diary) => {
        this.reviews.set(diary.reviews ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
