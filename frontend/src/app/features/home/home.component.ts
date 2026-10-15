import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucidePenLine, LucideUsers } from '@lucide/angular';
import { ReviewService } from '../../core/services/review.service';
import { MediaService } from '../../core/services/media.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { UiService } from '../../core/services/ui.service';
import { Review } from '../../core/models/review.model';
import { MediaItem } from '../../core/models/media-item.model';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    TranslatePipe,
    LucidePenLine,
    LucideUsers,
    MediaCardComponent,
    ReviewCardComponent,
    EmptyStateComponent,
  ],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ greeting() }}</h1>
        <p class="page-subtitle">{{ 'home.subtitle' | translate }}</p>
      </div>
    </header>

    <button type="button" class="group flex w-full items-center gap-4 rounded-panel border border-dashed border-border bg-surface/60 p-4 text-left transition hover:border-accent/60 hover:bg-surface" (click)="ui.openReview()">
      <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-paper transition group-hover:scale-105">
        <svg lucidePenLine [size]="21" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold">{{ 'home.promptTitle' | translate }}</span>
        <span class="block text-sm text-muted">{{ 'home.promptSubtitle' | translate }}</span>
      </span>
    </button>

    @if (suggestions().length) {
      <section class="mt-10">
        <div class="section-heading">
          <h2 class="section-title">{{ 'home.forYou' | translate }}</h2>
          <a routerLink="/explore" class="link-quiet text-sm">{{ 'home.seeAll' | translate }}</a>
        </div>
        <div class="chip-row gap-4 pb-2">
          @for (item of suggestions(); track item.id ?? item.externalKey ?? item.title) {
            <div class="w-[7.5rem] shrink-0 sm:w-[8.5rem]">
              <app-media-card [item]="item" />
            </div>
          }
        </div>
      </section>
    }

    <section class="mt-10" aria-labelledby="feed-title">
      <div class="section-heading">
        <h2 id="feed-title" class="section-title">{{ 'home.feedTitle' | translate }}</h2>
        <a routerLink="/people" class="link-quiet text-sm">{{ 'home.findPeople' | translate }}</a>
      </div>

      @if (reviews().length) {
        <div>
          @for (review of reviews(); track review.id) {
            <app-review-card [review]="review" (deleted)="remove(review.id)" (updated)="reload()" />
          }
        </div>
      } @else if (!loading() && !error()) {
        <app-empty-state [message]="'home.emptyMessage' | translate" [hint]="'home.emptyHint' | translate">
          <svg emptyIcon lucideUsers [size]="26" />
          <button type="button" class="btn-primary" (click)="ui.openReview()">{{ 'home.writeReview' | translate }}</button>
          <a routerLink="/people" class="btn-secondary">{{ 'home.findPeople' | translate }}</a>
        </app-empty-state>
      }

      @if (error()) {
        <div class="empty-state-box">
          <p class="text-sm text-muted">{{ 'common.loadFailed' | translate }}</p>
          <button type="button" class="btn-secondary btn-sm mt-3" (click)="reload()">{{ 'common.retry' | translate }}</button>
        </div>
      }

      @if (loading()) {
        <div class="space-y-6 py-5" aria-busy="true">
          @for (i of [1, 2, 3]; track i) {
            <div class="flex gap-4">
              <div class="skeleton hidden aspect-[2/3] w-[68px] sm:block"></div>
              <div class="flex-1 space-y-2.5">
                <div class="skeleton h-4 w-1/2"></div>
                <div class="skeleton h-3 w-1/4"></div>
                <div class="skeleton h-3 w-full"></div>
                <div class="skeleton h-3 w-4/5"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Always rendered so the observer has something to watch. -->
      <div #sentinel class="h-px" aria-hidden="true"></div>

      @if (!hasMore() && reviews().length > 0) {
        <p class="py-8 text-center text-sm text-muted">
          {{ 'home.endOfFeed' | translate }}
          <a routerLink="/explore" class="link-quiet">{{ 'home.exploreMore' | translate }}</a>
        </p>
      }
    </section>
  `,
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly reviewService = inject(ReviewService);
  private readonly mediaService = inject(MediaService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslationService);
  readonly ui = inject(UiService);

  readonly reviews = signal<Review[]>([]);
  readonly suggestions = signal<MediaItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly hasMore = signal(true);
  private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');

  private page = 0;
  private observer?: IntersectionObserver;

  constructor() {
    this.ui.reviewPublished$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      this.reload();
      this.loadSuggestions();
    });
  }

  greeting(): string {
    const user = this.auth.currentUser();
    const name = user?.fullName?.split(' ')[0] || user?.username;
    const hour = new Date().getHours();
    const key = hour < 5 ? 'home.greetingNight' : hour < 12 ? 'home.greetingMorning' : hour < 18 ? 'home.greetingAfternoon' : 'home.greetingEvening';
    const time = this.i18n.translate(key);
    return name ? this.i18n.translate('home.greetingNamed', { time, name }) : time;
  }

  ngOnInit(): void {
    this.loadSuggestions();
    this.loadMore();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) this.loadMore();
      },
      { rootMargin: '400px' }
    );
    this.observer.observe(this.sentinel().nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  reload(): void {
    this.page = 0;
    this.hasMore.set(true);
    this.reviews.set([]);
    this.loadMore();
  }

  remove(id: number): void {
    this.reviews.update((list) => list.filter((r) => r.id !== id));
  }

  private loadSuggestions(): void {
    this.mediaService.suggestions().subscribe({
      next: (items) => this.suggestions.set(items),
      error: () => this.suggestions.set([]),
    });
  }

  private loadMore(): void {
    if (!this.hasMore() || this.loading()) return;
    this.loading.set(true);
    this.error.set(false);
    this.reviewService.getFeed(this.page, PAGE_SIZE).subscribe({
      next: (items) => {
        if (items.length < PAGE_SIZE) this.hasMore.set(false);
        // De-duplicate in case new reviews shifted the pages.
        this.reviews.update((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...items.filter((r) => !seen.has(r.id))];
        });
        this.page++;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
        this.hasMore.set(false);
      },
    });
  }
}
