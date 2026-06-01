import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideHeart, LucideMessageCircle } from '@lucide/angular';
import { Review } from '../../../core/models/review.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ReactionService } from '../../../core/services/reaction.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-review-card',
    imports: [RouterLink, LucideHeart, LucideMessageCircle, StarRatingComponent],
    template: `
    <article class="card flex gap-4 transition hover:border-accent/20">
      @if (review().movie?.posterApiLink) {
        <a [routerLink]="['/movies', review().movie!.id]" class="shrink-0">
          <img
            [src]="review().movie!.posterApiLink"
            [alt]="review().movie!.title"
            class="h-24 w-16 rounded object-cover"
          />
        </a>
      }
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-start justify-between gap-2">
          <div>
            @if (review().user) {
              <a
                [routerLink]="['/profile', review().user!.username]"
                class="font-medium hover:text-accent"
              >
                {{ review().user!.username }}
              </a>
            }
            @if (review().movie) {
              <a
                [routerLink]="['/movies', review().movie!.id]"
                class="block text-sm text-muted hover:text-accent"
              >
                {{ review().movie!.title }}
                @if (review().movie!.year) {
                  ({{ review().movie!.year }})
                }
              </a>
            }
          </div>
          @if (review().rating) {
            <app-star-rating mode="display" [value]="review().rating!" />
          }
        </div>
        @if (review().text) {
          <p class="text-sm leading-relaxed text-text/90">{{ review().text }}</p>
        }
        <div class="mt-3 flex items-center gap-4 text-sm text-muted">
          <button
            type="button"
            class="flex items-center gap-1 transition hover:text-accent"
            [class.text-accent]="liked()"
            [disabled]="!auth.isLoggedIn()"
            (click)="toggleLike()"
          >
            <svg lucideHeart [size]="16" [class.fill-accent]="liked()" />
            {{ likeCount() }}
          </button>
          <span class="flex items-center gap-1">
            <svg lucideMessageCircle [size]="16" />
            {{ review().commentCount ?? 0 }}
          </span>
        </div>
      </div>
    </article>
  `
})
export class ReviewCardComponent implements OnInit {
  review = input.required<Review>();
  likedChange = output<boolean>();

  private readonly reactionService = inject(ReactionService);
  readonly auth = inject(AuthService);

  likeCount = signal(0);
  liked = signal(false);

  ngOnInit(): void {
    this.likeCount.set(this.review().likeCount ?? 0);
    this.liked.set(this.review().likedByCurrentUser ?? false);
  }

  toggleLike(): void {
    this.reactionService.toggle('review', this.review().id).subscribe((reactions) => {
      this.likeCount.set(this.reactionService.getLikeCount(reactions));
      this.liked.set(this.reactionService.isLikedByCurrentUser(reactions));
      this.likedChange.emit(this.liked());
    });
  }
}
