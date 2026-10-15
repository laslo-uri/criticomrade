import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LucideChevronRight, LucideCompass, LucideFilm, LucidePenLine } from '@lucide/angular';
import { ReviewService } from '../../core/services/review.service';
import { MediaService } from '../../core/services/media.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { Review } from '../../core/models/review.model';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { ActivityFeedCardComponent } from '../../shared/components/activity-feed-card/activity-feed-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { WriteReviewModalComponent } from '../../shared/components/write-review-modal/write-review-modal.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    TranslatePipe,
    LucidePenLine,
    LucideFilm,
    LucideCompass,
    LucideChevronRight,
    MediaCardComponent,
    ActivityFeedCardComponent,
    EmptyStateComponent,
    WriteReviewModalComponent,
  ],
  template: `
    <header class="page-header">
      <h1 class="page-title">{{ greeting() }}</h1>
      <p class="page-subtitle">{{ 'home.subtitle' | translate }}</p>
    </header>

    <div class="space-y-10">
      @if (auth.isLoggedIn()) {
      <button type="button" class="prompt-card group w-full text-left" (click)="reviewModalOpen.set(true)">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <svg lucidePenLine [size]="22" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold">{{ 'home.promptTitle' | translate }}</p>
          <p class="mt-0.5 text-sm text-muted">{{ 'home.promptSubtitle' | translate }}</p>
        </div>
        <svg lucideChevronRight [size]="20" class="shrink-0 text-muted" />
      </button>
      }

      @if (suggestions().length) {
        <section>
          <div class="section-heading">
            <h2 class="section-title">{{ 'home.becauseYouLiked' | translate }}</h2>
          </div>
          <div class="chip-row pb-1">
            @for (item of suggestions(); track item.id ?? item.externalKey ?? item.title) {
              <div class="w-32 shrink-0 snap-start">
                <app-media-card [item]="item" />
              </div>
            }
          </div>
        </section>
      }

      @for (section of carousels(); track section.titleKey) {
        <section>
          <div class="section-heading">
            <h2 class="section-title">{{ section.titleKey | translate }}</h2>
            <a [routerLink]="['/explore']" [queryParams]="{ type: section.type }" class="text-sm font-medium text-accent hover:underline">{{ 'home.seeAll' | translate }}</a>
          </div>
          <div class="chip-row pb-1">
            @for (item of section.items; track item.externalKey ?? item.tmdbId ?? item.title) {
              <div class="w-32 shrink-0 snap-start">
                <app-media-card [item]="item" />
              </div>
            }
          </div>
        </section>
      }

      @if (auth.isLoggedIn()) {
      <section>
        <div class="section-heading">
          <h2 class="section-title">{{ 'home.feedTitle' | translate }}</h2>
        </div>
        @if (loading() && reviews().length === 0) {
          <div class="space-y-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="card flex gap-3">
                <div class="skeleton h-10 w-10 rounded-full"></div>
                <div class="flex-1 space-y-2">
                  <div class="skeleton h-4 w-1/2"></div>
                  <div class="skeleton h-3 w-full"></div>
                </div>
              </div>
            }
          </div>
        } @else if (reviews().length === 0) {
          <app-empty-state [message]="'home.emptyMessage' | translate" [hint]="'home.emptyHint' | translate">
            <svg emptyIcon lucideFilm [size]="28" />
            <button type="button" class="btn-primary" (click)="reviewModalOpen.set(true)">{{ 'home.writeReview' | translate }}</button>
            <a routerLink="/explore" class="btn-secondary"><svg lucideCompass [size]="16" /> {{ 'home.exploreMovies' | translate }}</a>
          </app-empty-state>
        } @else {
          <div class="space-y-3">
            @for (review of reviews(); track review.id) {
              <app-activity-feed-card [review]="review" />
            }
          </div>
          <div #sentinel class="h-4"></div>
        }
      </section>
      }
    </div>

    <app-write-review-modal [open]="reviewModalOpen()" (closed)="reviewModalOpen.set(false)" (submitted)="reloadFeed()" />
  `,
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly reviewService = inject(ReviewService);
  private readonly mediaService = inject(MediaService);
  protected readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslationService);

  reviews = signal<Review[]>([]);
  suggestions = signal<MediaItem[]>([]);
  carousels = signal<{ type: MediaType; titleKey: string; items: MediaItem[] }[]>([]);
  loading = signal(false);
  reviewModalOpen = signal(false);
  sentinel = viewChild<ElementRef>('sentinel');

  private page = 0;
  private hasMore = true;
  private observer?: IntersectionObserver;

  greeting(): string {
    const name = this.auth.currentUser()?.fullName?.split(' ')[0] ?? this.auth.currentUser()?.username;
    const hour = new Date().getHours();
    const timeKey = hour < 12 ? 'home.greetingMorning' : hour < 18 ? 'home.greetingAfternoon' : 'home.greetingEvening';
    const time = this.i18n.translate(timeKey);
    return name ? this.i18n.translate('home.greetingNamed', { time, name }) : this.i18n.translate('home.greetingDefault');
  }

  ngOnInit(): void {
    const sections: { type: MediaType; titleKey: string }[] = [
      { type: 'FILM', titleKey: 'home.popularTitle' },
      { type: 'SHOW', titleKey: 'home.popularShows' },
      { type: 'BOOK', titleKey: 'home.popularBooks' },
      { type: 'ALBUM', titleKey: 'home.popularAlbums' },
    ];
    forkJoin(
      sections.map((section) =>
        this.mediaService.popular(section.type).pipe(
          map((items) => ({ ...section, items: items.slice(0, 12) })),
          catchError(() => of({ ...section, items: [] as MediaItem[] })),
        ),
      ),
    ).subscribe((results) => {
      this.carousels.set(results.filter((section) => section.items.length > 0));
    });
    if (this.auth.isLoggedIn()) {
      this.mediaService.suggestions().subscribe({
        next: (items) => this.suggestions.set(items),
        error: () => this.suggestions.set([]),
      });
      this.loadFeed();
    }
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && this.auth.isLoggedIn() && this.hasMore && !this.loading()) {
        this.loadFeed();
      }
    }, { rootMargin: '200px' });
    const el = this.sentinel()?.nativeElement;
    if (el) this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  reloadFeed(): void {
    this.page = 0;
    this.hasMore = true;
    this.reviews.set([]);
    this.loadFeed();
  }

  private loadFeed(): void {
    if (!this.hasMore) return;
    this.loading.set(true);
    this.reviewService.getFeed(this.page).subscribe({
      next: (items) => {
        if (items.length < 20) this.hasMore = false;
        this.reviews.update((prev) => [...prev, ...items]);
        this.page++;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
