import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideHeart,
  LucideMessageCircle,
  LucidePencil,
  LucideRotateCcw,
  LucideTrash2,
} from '@lucide/angular';
import { Review } from '../../../core/models/review.model';
import { Comment } from '../../../core/models/comment.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { PosterComponent } from '../poster/poster.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { ReactionService } from '../../../core/services/reaction.service';
import { CommentService } from '../../../core/services/comment.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TimeAgoPipe } from '../../../core/pipes/time-ago.pipe';
import { LocalDatePipe } from '../../../core/pipes/local-date.pipe';
import { mediaLink } from '../../../core/utils/media-link';
import { errorMessage } from '../../../core/utils/http-error';

interface CommentView extends Comment {
  author?: { username?: string; avatarUrl?: string };
}

@Component({
  selector: 'app-review-card',
  imports: [
    RouterLink,
    FormsModule,
    TranslatePipe,
    TimeAgoPipe,
    LocalDatePipe,
    LucideHeart,
    LucideMessageCircle,
    LucidePencil,
    LucideTrash2,
    LucideRotateCcw,
    StarRatingComponent,
    PosterComponent,
    AvatarComponent,
  ],
  template: `
    <article class="flex gap-4" [class]="boxed() ? 'card' : 'border-b border-border/60 py-5 first:pt-1 last:border-b-0'" [attr.aria-label]="ariaLabel()">
      @if (showMedia() && review().movie; as media) {
        <a [routerLink]="link().commands" [queryParams]="link().queryParams" class="hidden w-[68px] shrink-0 sm:block">
          <app-poster
            class="aspect-[2/3] overflow-hidden rounded-[4px] shadow-poster"
            [title]="media.title"
            [src]="media.posterApiLink"
            [mediaType]="media.mediaType"
            [year]="media.year"
          />
        </a>
      }

      <div class="min-w-0 flex-1">
        <header class="flex items-start gap-3">
          @if (showAuthor() && review().user; as author) {
            <a [routerLink]="['/profile', author.username]" class="shrink-0" tabindex="-1" aria-hidden="true">
              <app-avatar [name]="author.username" [url]="author.avatarUrl" [size]="36" />
            </a>
          }
          <div class="min-w-0 flex-1">
            <p class="text-[14px] leading-snug">
              @if (showAuthor() && review().user; as author) {
                <a [routerLink]="['/profile', author.username]" class="font-semibold text-text hover:text-accent-ink">{{ author.username }}</a>
                @if (showMedia() && review().movie) {
                  <span class="text-muted"> {{ 'review.on' | translate }} </span>
                }
              }
              @if (showMedia() && review().movie; as media) {
                <a [routerLink]="link().commands" [queryParams]="link().queryParams" class="font-semibold text-text hover:text-accent-ink">{{ media.title }}</a>
                @if (media.year) {
                  <span class="text-muted"> ({{ media.year }})</span>
                }
              }
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
              @if (!editing() && review().rating) {
                <app-star-rating [value]="review().rating!" [size]="14" />
              }
              @if (review().dateWatched) {
                <span>{{ 'review.watched' | translate: { date: (review().dateWatched | localDate) } }}</span>
              } @else if (review().reviewTime) {
                <span>{{ review().reviewTime | timeAgo }}</span>
              }
              @if (review().seenBefore) {
                <span class="inline-flex items-center gap-1"><svg lucideRotateCcw [size]="12" /> {{ 'review.rewatch' | translate }}</span>
              }
            </div>
          </div>
        </header>

        @if (editing()) {
          <div class="mt-4 space-y-3">
            <app-star-rating mode="input" [size]="26" [value]="editRating()" (valueChange)="editRating.set($event)" [label]="'reviewModal.rating' | translate" />
            <textarea class="input-field min-h-28" [(ngModel)]="editText" [attr.aria-label]="'reviewModal.review' | translate"></textarea>
            <div class="flex gap-2">
              <button type="button" class="btn-primary btn-sm" [disabled]="!editRating() || busy()" (click)="saveEdit()">{{ 'common.save' | translate }}</button>
              <button type="button" class="btn-ghost btn-sm" (click)="editing.set(false)">{{ 'common.cancel' | translate }}</button>
            </div>
          </div>
        } @else if (review().text) {
          @if (review().isContainedSpoiler && !spoilerShown()) {
            <button type="button" class="mt-3 block w-full text-left" (click)="spoilerShown.set(true)">
              <span class="tag mb-1.5 bg-accent/15 text-accent-ink">{{ 'review.spoiler' | translate }}</span>
              <span class="block text-[15px] leading-relaxed text-text/90 spoiler-blur" aria-hidden="true">{{ review().text }}</span>
              <span class="mt-1 block text-[13px] font-semibold text-accent-ink">{{ 'review.showSpoiler' | translate }}</span>
            </button>
          } @else {
            <p class="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-text/90" [class.line-clamp-5]="compact() && !expanded()">{{ review().text }}</p>
            @if (compact() && !expanded() && (review().text?.length ?? 0) > 320) {
              <button type="button" class="mt-1 text-[13px] font-semibold text-accent-ink hover:underline" (click)="expanded.set(true)">{{ 'review.readMore' | translate }}</button>
            }
          }
        }

        <footer class="-ml-2 mt-2 flex flex-wrap items-center gap-1 text-[13px] text-muted">
          <button
            type="button"
            class="btn-ghost btn-sm gap-1.5 !px-2"
            [class.text-accent-ink]="liked()"
            [attr.aria-pressed]="liked()"
            (click)="toggleLike()"
          >
            <svg lucideHeart [size]="16" [class.fill-current]="liked()" />
            <span class="sr-only">{{ (liked() ? 'review.unlike' : 'review.like') | translate }}</span>
            <span class="tabular-nums">{{ likeCount() }}</span>
          </button>
          <button
            type="button"
            class="btn-ghost btn-sm gap-1.5 !px-2"
            [attr.aria-expanded]="commentsOpen()"
            (click)="toggleComments()"
          >
            <svg lucideMessageCircle [size]="16" />
            <span class="sr-only">{{ 'review.comments' | translate }}</span>
            <span class="tabular-nums">{{ commentCount() }}</span>
          </button>
          @if (ownReview() && !editing()) {
            <span class="flex-1"></span>
            @if (confirmingDelete()) {
              <span class="mr-1 text-[13px] text-text">{{ 'review.confirmDelete' | translate }}</span>
              <button type="button" class="btn-sm btn !bg-danger/15 !text-danger hover:!bg-danger/25" (click)="remove()">{{ 'common.delete' | translate }}</button>
              <button type="button" class="btn-ghost btn-sm" (click)="confirmingDelete.set(false)">{{ 'common.cancel' | translate }}</button>
            } @else {
              <button type="button" class="icon-btn h-9 w-9" (click)="startEdit()" [attr.aria-label]="'review.edit' | translate">
                <svg lucidePencil [size]="15" />
              </button>
              <button type="button" class="icon-btn h-9 w-9" (click)="confirmingDelete.set(true)" [attr.aria-label]="'common.delete' | translate">
                <svg lucideTrash2 [size]="15" />
              </button>
            }
          }
        </footer>

        @if (commentsOpen()) {
          <section class="mt-2 space-y-3 border-t border-border/70 pt-3" [attr.aria-label]="'review.comments' | translate">
            @if (loadingComments()) {
              <div class="skeleton h-4 w-2/3"></div>
            }
            @for (comment of comments(); track comment.id) {
              <div class="flex items-start gap-2.5 text-sm">
                <app-avatar [name]="commentAuthor(comment)" [size]="26" />
                <div class="min-w-0 flex-1">
                  <p class="leading-snug">
                    <a [routerLink]="['/profile', commentAuthor(comment)]" class="font-semibold hover:text-accent-ink">{{ commentAuthor(comment) }}</a>
                    <span class="ml-1.5 text-xs text-muted">· {{ comment.createdAt | timeAgo }}</span>
                  </p>
                  <p class="mt-0.5 whitespace-pre-line text-text/90">{{ comment.text }}</p>
                </div>
                @if (canDeleteComment(comment)) {
                  <button type="button" class="text-xs font-medium text-muted hover:text-danger" (click)="removeComment(comment.id)">{{ 'common.delete' | translate }}</button>
                }
              </div>
            } @empty {
              @if (!loadingComments()) {
                <p class="text-sm text-muted">{{ 'review.noComments' | translate }}</p>
              }
            }
            @if (auth.isLoggedIn()) {
              <form class="flex gap-2" (submit)="addComment($event)">
                <input class="input-field !min-h-10 !py-2 text-sm" name="comment" [(ngModel)]="draft" [placeholder]="'review.commentPlaceholder' | translate" maxlength="1000" autocomplete="off" />
                <button type="submit" class="btn-secondary btn-sm" [disabled]="!draft.trim() || busy()">{{ 'common.send' | translate }}</button>
              </form>
            } @else {
              <p class="text-sm text-muted">
                <a routerLink="/auth/login" class="link-quiet">{{ 'nav.logIn' | translate }}</a> {{ 'review.toComment' | translate }}
              </p>
            }
          </section>
        }
      </div>
    </article>
  `,
})
export class ReviewCardComponent {
  readonly review = input.required<Review>();
  readonly showMedia = input(true);
  readonly showAuthor = input(true);
  readonly compact = input(true);
  /** Boxed card, or a ruled diary entry for long lists. */
  readonly boxed = input(false);
  readonly deleted = output<void>();
  readonly updated = output<void>();

  private readonly reactionService = inject(ReactionService);
  private readonly commentService = inject(CommentService);
  private readonly reviewService = inject(ReviewService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  readonly auth = inject(AuthService);

  readonly likeCount = signal(0);
  readonly liked = signal(false);
  readonly commentCount = signal(0);
  readonly commentsOpen = signal(false);
  readonly loadingComments = signal(false);
  readonly comments = signal<CommentView[]>([]);
  readonly editing = signal(false);
  readonly editRating = signal(0);
  readonly confirmingDelete = signal(false);
  readonly spoilerShown = signal(false);
  readonly expanded = signal(false);
  readonly busy = signal(false);
  editText = '';
  draft = '';

  readonly link = computed(() => mediaLink(this.review().movie));
  readonly ownReview = computed(
    () => !!this.auth.currentUser() && this.auth.currentUser()?.username === this.review().user?.username
  );
  readonly ariaLabel = computed(() => {
    const r = this.review();
    return [r.user?.username, r.movie?.title].filter(Boolean).join(' — ');
  });

  constructor() {
    // Keep counters in sync if the parent hands us a refreshed review.
    effect(() => {
      const r = this.review();
      this.likeCount.set(r.likeCount ?? 0);
      this.liked.set(r.likedByCurrentUser ?? false);
      this.commentCount.set(r.commentCount ?? 0);
    });
  }

  toggleLike(): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.info(this.i18n.translate('review.signInToLike'));
      return;
    }
    // Optimistic: flip now, reconcile with the server answer.
    const wasLiked = this.liked();
    this.liked.set(!wasLiked);
    this.likeCount.update((n) => n + (wasLiked ? -1 : 1));
    this.reactionService.toggle('review', this.review().id).subscribe({
      next: (reactions) => {
        this.likeCount.set(this.reactionService.getLikeCount(reactions));
        this.liked.set(this.reactionService.isLikedByCurrentUser(reactions));
      },
      error: () => {
        this.liked.set(wasLiked);
        this.likeCount.update((n) => n + (wasLiked ? 1 : -1));
        this.toast.error(this.i18n.translate('common.actionFailed'));
      },
    });
  }

  toggleComments(): void {
    this.commentsOpen.update((open) => !open);
    if (this.commentsOpen() && this.comments().length === 0) {
      this.loadingComments.set(true);
      this.commentService.getForReview(this.review().id).subscribe({
        next: (comments) => {
          this.comments.set(comments as CommentView[]);
          this.commentCount.set(comments.length);
          this.loadingComments.set(false);
        },
        error: () => this.loadingComments.set(false),
      });
    }
  }

  addComment(event: Event): void {
    event.preventDefault();
    const text = this.draft.trim();
    if (!text || this.busy()) return;
    this.busy.set(true);
    this.commentService.add(this.review().id, { text }).subscribe({
      next: (comment) => {
        this.comments.update((list) => [...list, comment as CommentView]);
        this.commentCount.update((n) => n + 1);
        this.draft = '';
        this.busy.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, this.i18n.translate('review.commentFailed')));
        this.busy.set(false);
      },
    });
  }

  removeComment(id: number): void {
    this.commentService.delete(id).subscribe({
      next: () => {
        this.comments.update((list) => list.filter((c) => c.id !== id));
        this.commentCount.update((n) => Math.max(0, n - 1));
      },
      error: () => this.toast.error(this.i18n.translate('common.actionFailed')),
    });
  }

  commentAuthor(comment: CommentView): string {
    return comment.author?.username ?? comment.user?.username ?? '';
  }

  canDeleteComment(comment: CommentView): boolean {
    const me = this.auth.currentUser()?.username;
    return !!me && (this.commentAuthor(comment) === me || this.ownReview());
  }

  startEdit(): void {
    this.editRating.set(this.review().rating ?? 0);
    this.editText = this.review().text ?? '';
    this.editing.set(true);
  }

  saveEdit(): void {
    const movie = this.review().movie;
    this.busy.set(true);
    this.reviewService
      .update(this.review().id, {
        tmdbId: movie?.tmdbId,
        externalKey: movie?.externalKey,
        mediaType: movie?.mediaType,
        rating: this.editRating(),
        text: this.editText.trim(),
      })
      .subscribe({
        next: () => {
          this.editing.set(false);
          this.busy.set(false);
          this.updated.emit();
          this.toast.success(this.i18n.translate('review.updated'));
        },
        error: (err) => {
          this.busy.set(false);
          this.toast.error(errorMessage(err, this.i18n.translate('review.updateFailed')));
        },
      });
  }

  remove(): void {
    this.reviewService.delete(this.review().id).subscribe({
      next: () => {
        this.toast.success(this.i18n.translate('review.deleted'));
        this.deleted.emit();
      },
      error: (err) => {
        this.confirmingDelete.set(false);
        this.toast.error(errorMessage(err, this.i18n.translate('review.deleteFailed')));
      },
    });
  }
}
