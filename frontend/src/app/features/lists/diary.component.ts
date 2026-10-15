import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideBookOpen, LucideRotateCcw } from '@lucide/angular';
import { ListService } from '../../core/services/list.service';
import { UiService } from '../../core/services/ui.service';
import { TranslationService } from '../../core/services/translation.service';
import { Review } from '../../core/models/review.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { mediaLink, MEDIA_TYPE_KEYS } from '../../core/utils/media-link';
import { MediaType } from '../../core/models/media-item.model';

interface MonthGroup {
  key: string;
  label: string;
  entries: { review: Review; day: string; weekday: string }[];
}

@Component({
  selector: 'app-diary',
  imports: [RouterLink, TranslatePipe, LucideBookOpen, LucideRotateCcw, EmptyStateComponent, StarRatingComponent, PosterComponent],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'diary.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'diary.subtitle' | translate }}</p>
      </div>
      @if (reviews().length) {
        <button type="button" class="btn-primary" (click)="ui.openReview()">{{ 'nav.logTitle' | translate }}</button>
      }
    </header>

    @if (loading()) {
      <div class="space-y-4" aria-busy="true">
        @for (i of [1, 2, 3, 4]; track i) { <div class="skeleton h-20 w-full"></div> }
      </div>
    } @else if (reviews().length === 0) {
      <app-empty-state [message]="'diary.emptyMessage' | translate" [hint]="'diary.emptyHint' | translate">
        <svg emptyIcon lucideBookOpen [size]="26" />
        <button type="button" class="btn-primary" (click)="ui.openReview()">{{ 'nav.logTitle' | translate }}</button>
      </app-empty-state>
    } @else {
      @for (group of groups(); track group.key) {
        <section class="mb-10" [attr.aria-label]="group.label">
          <h2 class="sticky top-16 z-10 -mx-1 mb-2 bg-bg/90 px-1 py-2 font-display text-2xl font-bold uppercase leading-none tracking-[0.02em] text-accent-ink backdrop-blur-sm">{{ group.label }}</h2>
          <ol>
            @for (entry of group.entries; track entry.review.id) {
              <li class="grid grid-cols-[3rem_2.75rem_minmax(0,1fr)] items-center gap-3 border-b border-border/60 py-3 sm:grid-cols-[3.5rem_3rem_minmax(0,1fr)_auto] sm:gap-4">
                <div class="text-center leading-none">
                  <span class="block font-display text-3xl font-bold tabular-nums">{{ entry.day }}</span>
                  <span class="mt-0.5 block text-[11px] text-muted">{{ entry.weekday }}</span>
                </div>
                <a [routerLink]="link(entry.review).commands" [queryParams]="link(entry.review).queryParams" class="block" tabindex="-1" aria-hidden="true">
                  <app-poster class="aspect-[2/3] overflow-hidden rounded-[3px]" [title]="entry.review.movie?.title ?? ''" [src]="entry.review.movie?.posterApiLink" [mediaType]="entry.review.movie?.mediaType" />
                </a>
                <div class="min-w-0">
                  <a [routerLink]="link(entry.review).commands" [queryParams]="link(entry.review).queryParams" class="block truncate font-semibold hover:text-accent-ink">{{ entry.review.movie?.title }}</a>
                  <p class="flex items-center gap-2 text-[13px] text-muted">
                    <span>{{ typeKey(entry.review.movie?.mediaType) | translate }}@if (entry.review.movie?.year) {, {{ entry.review.movie?.year }}}</span>
                    @if (entry.review.seenBefore) { <svg lucideRotateCcw [size]="12" [attr.aria-label]="'review.rewatch' | translate" /> }
                  </p>
                  <div class="mt-1 sm:hidden">
                    @if (entry.review.rating) { <app-star-rating [value]="entry.review.rating" [size]="13" /> }
                  </div>
                </div>
                <div class="hidden sm:block">
                  @if (entry.review.rating) { <app-star-rating [value]="entry.review.rating" [size]="15" /> }
                </div>
              </li>
            }
          </ol>
        </section>
      }
    }
  `,
})
export class DiaryComponent implements OnInit {
  private readonly listService = inject(ListService);
  private readonly i18n = inject(TranslationService);
  readonly ui = inject(UiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);

  readonly groups = computed<MonthGroup[]>(() => {
    const locale = this.i18n.intlLocale;
    const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const sorted = [...this.reviews()].sort((a, b) => this.dateOf(b).localeCompare(this.dateOf(a)));
    const groups: MonthGroup[] = [];
    for (const review of sorted) {
      const iso = this.dateOf(review);
      const date = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
      const key = iso.slice(0, 7);
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, label: month.format(date), entries: [] };
        groups.push(group);
      }
      group.entries.push({ review, day: String(date.getDate()), weekday: weekday.format(date) });
    }
    return groups;
  });

  ngOnInit(): void {
    this.load();
    this.ui.reviewPublished$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  link(review: Review) {
    return mediaLink(review.movie);
  }

  typeKey(type?: MediaType): string {
    return MEDIA_TYPE_KEYS[type ?? 'FILM'];
  }

  private dateOf(review: Review): string {
    return review.dateWatched ?? review.reviewTime ?? '';
  }

  private load(): void {
    this.listService.getDiary().subscribe({
      next: (diary) => {
        this.reviews.set(diary.reviews ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
