import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Review } from '../../../core/models/review.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-activity-feed-card',
  imports: [RouterLink, StarRatingComponent],
  template: `
    <article class="card flex gap-3">
      <a [routerLink]="['/profile', review().user?.username]" class="shrink-0">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-sm font-semibold">
          {{ review().user?.username?.charAt(0)?.toUpperCase() }}
        </div>
      </a>
      <div class="min-w-0 flex-1">
        <p class="text-sm">
          <a [routerLink]="['/profile', review().user?.username]" class="font-semibold hover:text-accent">
            {{ review().user?.username }}
          </a>
          <span class="text-muted"> rated </span>
          <a [routerLink]="['/media', review().movie?.id]" class="font-medium hover:text-accent">
            {{ review().movie?.title }}
          </a>
        </p>
        @if (review().rating) {
          <div class="mt-1">
            <app-star-rating mode="display" [value]="review().rating!" />
          </div>
        }
        @if (review().text) {
          <p class="mt-2 line-clamp-3 text-sm leading-relaxed text-text/90">{{ review().text }}</p>
        }
      </div>
      @if (review().movie?.posterApiLink) {
        <a [routerLink]="['/media', review().movie?.id]" class="shrink-0">
          <img
            [src]="review().movie!.posterApiLink"
            [alt]="review().movie!.title"
            class="h-20 w-14 rounded-md object-cover"
          />
        </a>
      }
    </article>
  `,
})
export class ActivityFeedCardComponent {
  review = input.required<Review>();
}
