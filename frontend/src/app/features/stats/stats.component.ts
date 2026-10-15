import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatsService } from '../../core/services/stats.service';
import { AuthService } from '../../core/services/auth.service';
import { TasteService, TasteProfile, DiaryStats } from '../../core/services/taste.service';
import { PlatformStats } from '../../core/models/stats.model';
import { TasteProfileComponent } from '../../shared/components/taste-profile/taste-profile.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MEDIA_TYPE_KEYS } from '../../core/utils/media-link';
import { MediaType } from '../../core/models/media-item.model';

const TYPE_COLORS: Record<string, string> = { FILM: 'bg-accent', SHOW: 'bg-brass', BOOK: 'bg-[#2E4057]', ALBUM: 'bg-[#5E6B3A]', EPISODE: 'bg-muted' };

@Component({
  selector: 'app-stats',
  imports: [TranslatePipe, TasteProfileComponent, RouterLink, DecimalPipe],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'stats.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'stats.subtitle' | translate }}</p>
      </div>
    </header>

    @if (auth.isLoggedIn()) {
      @if (diary(); as year) {
        <section class="mb-12" [attr.aria-label]="'stats.yearInReview' | translate: { year: year.year }">
          <h2 class="font-display text-[clamp(2.4rem,6vw,3.8rem)] font-extrabold uppercase leading-[0.9]">{{ 'stats.yearInReview' | translate: { year: year.year } }}</h2>
          <div class="mt-6 grid gap-px overflow-hidden rounded-panel border border-border/70 bg-border/70 sm:grid-cols-3">
            <div class="bg-surface p-5">
              <p class="text-sm text-muted">{{ 'stats.logged' | translate }}</p>
              <p class="font-display text-5xl font-extrabold tabular-nums leading-none">{{ year.yearCount }}</p>
            </div>
            <div class="bg-surface p-5">
              <p class="text-sm text-muted">{{ 'stats.average' | translate }}</p>
              <p class="font-display text-5xl font-extrabold tabular-nums leading-none">{{ year.yearAverage | number: '1.1-1' }}<span class="text-2xl text-muted"> / 5</span></p>
            </div>
            <div class="bg-surface p-5">
              <p class="text-sm text-muted">{{ 'stats.topGenre' | translate }}</p>
              <p class="truncate font-display text-4xl font-extrabold uppercase leading-none">{{ year.topGenre || '–' }}</p>
            </div>
          </div>

          @if (year.yearCount) {
            <div class="mt-8 grid gap-10 md:grid-cols-2">
              <div>
                <h3 class="mb-3 font-semibold">{{ 'stats.distribution' | translate }}</h3>
                <div class="flex h-40 items-end gap-3" role="img" [attr.aria-label]="distributionLabel(year.distribution)">
                  @for (count of year.distribution; track $index) {
                    <div class="flex flex-1 flex-col items-center gap-1.5">
                      <span class="text-[13px] tabular-nums text-muted">{{ count }}</span>
                      <div class="w-full rounded-t-sm" [class]="$index === 4 ? 'bg-accent' : 'bg-brass/80'" [style.height.px]="barHeight(count, year.distribution)"></div>
                      <span class="text-[13px] font-semibold">{{ $index + 1 }}★</span>
                    </div>
                  }
                </div>
              </div>
              @if (year.mediaTypes.length) {
                <div>
                  <h3 class="mb-3 font-semibold">{{ 'stats.mediaMix' | translate }}</h3>
                  <div class="flex h-4 overflow-hidden rounded-sm">
                    @for (type of year.mediaTypes; track type.name) {
                      <div class="h-full" [class]="color(type.name)" [style.width.%]="type.percentage" [attr.title]="type.name + ' ' + type.percentage + '%'"></div>
                    }
                  </div>
                  <ul class="mt-3 space-y-1.5 text-sm">
                    @for (type of year.mediaTypes; track type.name) {
                      <li class="flex items-center gap-2">
                        <span class="h-3 w-3 rounded-sm" [class]="color(type.name)"></span>
                        <span class="flex-1">{{ typeKey(type.name) | translate }}</span>
                        <span class="tabular-nums text-muted">{{ type.count }}, {{ type.percentage }}%</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </section>
      }

      @if (taste()) {
        <div class="mb-12"><app-taste-profile [profile]="taste()" /></div>
      }
    } @else {
      <div class="mb-12 rounded-panel border border-border/70 bg-surface p-5">
        <p class="font-semibold">{{ 'stats.signInTitle' | translate }}</p>
        <p class="mt-1 text-sm text-muted">{{ 'stats.signInText' | translate }}</p>
        <a routerLink="/auth/login" [queryParams]="{ returnUrl: '/stats' }" class="btn-primary btn-sm mt-3">{{ 'nav.logIn' | translate }}</a>
      </div>
    }

    <section [attr.aria-label]="'stats.platform' | translate">
      <h2 class="section-title mb-4">{{ 'stats.platform' | translate }}</h2>
      @if (stats(); as platform) {
        <dl class="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border/70 bg-border/70 sm:grid-cols-3">
          @for (card of cards(platform); track card.label) {
            <div class="bg-surface p-5">
              <dt class="text-sm text-muted">{{ card.label | translate }}</dt>
              <dd class="font-display text-4xl font-extrabold tabular-nums leading-tight">{{ card.value | number }}</dd>
            </div>
          }
        </dl>
      } @else if (statsFailed()) {
        <p class="text-sm text-muted">{{ 'common.loadFailed' | translate }}</p>
      } @else {
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) { <div class="skeleton h-24"></div> }
        </div>
      }
    </section>
  `,
})
export class StatsComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly tasteService = inject(TasteService);
  readonly auth = inject(AuthService);

  readonly stats = signal<PlatformStats | null>(null);
  readonly statsFailed = signal(false);
  readonly taste = signal<TasteProfile | null>(null);
  readonly diary = signal<DiaryStats | null>(null);

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.statsFailed.set(true),
    });
    const username = this.auth.currentUser()?.username;
    if (username) {
      this.tasteService.profile(username).subscribe({ next: (t) => this.taste.set(t), error: () => undefined });
      this.tasteService.diary(username).subscribe({ next: (d) => this.diary.set(d), error: () => undefined });
    }
  }

  cards(stats: PlatformStats): { label: string; value: number }[] {
    return [
      { label: 'stats.people', value: stats.userCount },
      { label: 'stats.titles', value: stats.movieCount },
      { label: 'stats.reviews', value: stats.reviewCount },
      { label: 'stats.comments', value: stats.commentCount },
      { label: 'stats.reactions', value: stats.reactionCount },
      { label: 'stats.challenges', value: stats.recommendationCount },
    ];
  }

  barHeight(count: number, distribution: number[]): number {
    const max = Math.max(...distribution, 1);
    return Math.max(3, Math.round((count / max) * 104));
  }

  distributionLabel(distribution: number[]): string {
    return distribution.map((c, i) => `${i + 1}★: ${c}`).join(', ');
  }

  color(name: string): string {
    return TYPE_COLORS[name] ?? 'bg-muted';
  }

  typeKey(name: string): string {
    return MEDIA_TYPE_KEYS[name as MediaType] ?? name;
  }
}
