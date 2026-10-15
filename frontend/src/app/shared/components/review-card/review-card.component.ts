import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideHeart, LucideMessageCircle, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Review } from '../../../core/models/review.model';
import { Comment } from '../../../core/models/comment.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ReactionService } from '../../../core/services/reaction.service';
import { CommentService } from '../../../core/services/comment.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface CommentView extends Comment {
  author?: { username?: string };
}

@Component({
  selector: 'app-review-card',
  imports: [RouterLink, FormsModule, LucideHeart, LucideMessageCircle, LucidePencil, LucideTrash2, StarRatingComponent],
  template: `
    <article class="card flex gap-4 transition hover:border-accent/20">
      @if (review().movie?.posterApiLink) {
        <a [routerLink]="['/media', review().movie!.id]" class="hidden shrink-0 sm:block">
          <img [src]="review().movie!.posterApiLink" [alt]="review().movie!.title" class="h-24 w-16 rounded object-cover" />
        </a>
      }
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-start justify-between gap-2">
          <div class="min-w-0">
            @if (review().user) {
              <a [routerLink]="['/profile', review().user!.username]" class="font-medium hover:text-accent">
                {{ review().user!.username }}
              </a>
            }
            @if (review().movie) {
              <a [routerLink]="['/media', review().movie!.id]" class="block truncate text-sm text-muted hover:text-accent">
                {{ review().movie!.title }}
                @if (review().movie!.year) { ({{ review().movie!.year }}) }
              </a>
            }
          </div>
          @if (!editing()) {
            @if (review().rating) {
              <app-star-rating mode="display" [value]="review().rating!" />
            }
          }
        </div>
        @if (editing()) {
          <app-star-rating mode="input" [value]="editRating()" (valueChange)="editRating.set($event)" />
          <textarea class="input-field mt-2 min-h-24" [(ngModel)]="editText"></textarea>
          <div class="mt-2 flex gap-2">
            <button type="button" class="btn-primary min-h-11" (click)="saveEdit()">Save</button>
            <button type="button" class="btn-secondary min-h-11" (click)="editing.set(false)">Cancel</button>
          </div>
        } @else if (review().text) {
          <p class="text-sm leading-relaxed text-text/90">{{ review().text }}</p>
        }
        <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
          <button type="button" class="inline-flex min-h-11 items-center gap-1 hover:text-accent" [class.text-accent]="liked()" [disabled]="!auth.isLoggedIn()" (click)="toggleLike()">
            <svg lucideHeart [size]="16" [class.fill-accent]="liked()" />
            {{ likeCount() }}
          </button>
          <button type="button" class="inline-flex min-h-11 items-center gap-1 hover:text-accent" (click)="toggleComments()">
            <svg lucideMessageCircle [size]="16" />
            {{ review().commentCount ?? comments().length }}
          </button>
          @if (ownReview()) {
            <button type="button" class="inline-flex min-h-11 items-center gap-1 hover:text-accent" (click)="startEdit()">
              <svg lucidePencil [size]="16" />
            </button>
            <button type="button" class="inline-flex min-h-11 items-center gap-1 hover:text-accent" (click)="remove()">
              <svg lucideTrash2 [size]="16" />
            </button>
          }
        </div>
        @if (commentsOpen()) {
          <div class="mt-3 space-y-2 border-t border-border pt-3">
            @for (comment of comments(); track comment.id) {
              <div class="flex items-start justify-between gap-2 text-sm">
                <p><span class="font-medium">{{ commentAuthor(comment) }}</span> {{ comment.text }}</p>
                @if (commentAuthor(comment) === auth.currentUser()?.username) {
                  <button type="button" class="text-xs text-muted hover:text-accent" (click)="removeComment(comment.id)">Delete</button>
                }
              </div>
            }
            @if (auth.isLoggedIn()) {
              <form class="flex gap-2" (submit)="addComment($event)">
                <input class="input-field min-h-11" name="comment" [(ngModel)]="draft" placeholder="Add a comment" />
                <button type="submit" class="btn-secondary min-h-11" [disabled]="!draft.trim()">Send</button>
              </form>
            }
          </div>
        }
      </div>
    </article>
  `,
})
export class ReviewCardComponent implements OnInit {
  review = input.required<Review>();
  likedChange = output<boolean>();
  deleted = output<void>();
  updated = output<void>();

  private readonly reactionService = inject(ReactionService);
  private readonly commentService = inject(CommentService);
  private readonly reviewService = inject(ReviewService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  likeCount = signal(0);
  liked = signal(false);
  commentsOpen = signal(false);
  comments = signal<CommentView[]>([]);
  editing = signal(false);
  editRating = signal(0);
  editText = '';
  draft = '';

  ngOnInit(): void {
    this.likeCount.set(this.review().likeCount ?? 0);
    this.liked.set(this.review().likedByCurrentUser ?? false);
    this.editRating.set(this.review().rating ?? 0);
    this.editText = this.review().text ?? '';
  }

  ownReview(): boolean {
    return !!this.auth.currentUser() && this.auth.currentUser()?.username === this.review().user?.username;
  }

  toggleLike(): void {
    this.reactionService.toggle('review', this.review().id).subscribe((reactions) => {
      this.likeCount.set(this.reactionService.getLikeCount(reactions));
      this.liked.set(this.reactionService.isLikedByCurrentUser(reactions));
      this.likedChange.emit(this.liked());
    });
  }

  toggleComments(): void {
    this.commentsOpen.update((open) => !open);
    if (this.commentsOpen() && this.comments().length === 0) {
      this.commentService.getForReview(this.review().id).subscribe((comments) => {
        this.comments.set(comments as CommentView[]);
      });
    }
  }

  addComment(event: Event): void {
    event.preventDefault();
    const text = this.draft.trim();
    if (!text) return;
    this.commentService.add(this.review().id, { text }).subscribe((comment) => {
      this.comments.update((list) => [...list, comment as CommentView]);
      this.draft = '';
    });
  }

  removeComment(id: number): void {
    this.commentService.delete(id).subscribe(() => {
      this.comments.update((list) => list.filter((comment) => comment.id !== id));
    });
  }

  commentAuthor(comment: CommentView): string {
    return comment.author?.username ?? comment.user?.username ?? '';
  }

  startEdit(): void {
    this.editRating.set(this.review().rating ?? 0);
    this.editText = this.review().text ?? '';
    this.editing.set(true);
  }

  saveEdit(): void {
    const movie = this.review().movie;
    this.reviewService.update(this.review().id, {
      tmdbId: movie?.tmdbId,
      externalKey: movie?.externalKey,
      mediaType: movie?.mediaType,
      rating: this.editRating(),
      text: this.editText,
    }).subscribe({
      next: () => {
        this.editing.set(false);
        this.updated.emit();
        this.toast.success('Review updated');
      },
      error: () => this.toast.error('Could not update review'),
    });
  }

  remove(): void {
    if (!confirm('Delete this review?')) return;
    this.reviewService.delete(this.review().id).subscribe({
      next: () => this.deleted.emit(),
      error: () => this.toast.error('Could not delete review'),
    });
  }
}
