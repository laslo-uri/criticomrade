import { Component, inject, signal } from '@angular/core';
import { StatsService } from '../../core/services/stats.service';
import { AuthService } from '../../core/services/auth.service';
import { TasteService, TasteProfile, DiaryStats } from '../../core/services/taste.service';
import { PlatformStats } from '../../core/models/stats.model';
import { TasteProfileComponent } from '../../shared/components/taste-profile/taste-profile.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-stats',
  imports: [TranslatePipe, TasteProfileComponent],
  template: `
    <div class="space-y-6">
      <header class="page-header">
        <h1 class="page-title">{{ 'stats.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'stats.subtitle' | translate }}</p>
      </header>
      @if (stats(); as platform) {
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
          @for (card of cards(platform); track card.label) {
            <article class="card">
              <p class="text-2xl font-semibold">{{ card.value }}</p>
              <p class="text-sm text-muted">{{ card.label | translate }}</p>
            </article>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 gap-3">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="skeleton h-20"></div>
          }
        </div>
      }

      @if (diary(); as year) {
        <section class="card space-y-4">
          <div>
            <h2 class="text-lg font-semibold">{{ 'stats.yearInReview' | translate: { year: year.year } }}</h2>
            <p class="text-sm text-muted">
              {{ 'stats.yearCount' | translate: { count: year.yearCount, average: year.yearAverage } }}
              @if (year.topGenre) {
                · {{ year.topGenre }}
              }
            </p>
          </div>
          <div>
            <h3 class="mb-2 text-sm font-medium">{{ 'stats.distribution' | translate }}</h3>
            <ul class="space-y-2">
              @for (count of year.distribution; track $index; let star = $index) {
                <li class="flex items-center gap-3 text-sm">
                  <span class="w-8 text-muted">{{ star + 1 }}★</span>
                  <div class="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
                    <div class="h-full rounded-full bg-secondary" [style.width.%]="barWidth(count, year.distribution)"></div>
                  </div>
                  <span class="w-8 text-right text-muted">{{ count }}</span>
                </li>
              }
            </ul>
          </div>
          @if (year.mediaTypes.length) {
            <div>
              <h3 class="mb-2 text-sm font-medium">{{ 'stats.mediaMix' | translate }}</h3>
              <div class="flex h-3 overflow-hidden rounded-full">
                @for (type of year.mediaTypes; track type.name) {
                  <div class="h-full bg-accent" [style.width.%]="type.percentage" [attr.title]="type.name + ' ' + type.percentage + '%'"></div>
                }
              </div>
              <ul class="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                @for (type of year.mediaTypes; track type.name) {
                  <li>{{ type.name }} {{ type.percentage }}%</li>
                }
              </ul>
            </div>
          }
        </section>
      }

      @if (taste()) {
        <app-taste-profile [profile]="taste()" />
      }
    </div>
  `,
})
export class StatsComponent {
  private readonly statsService = inject(StatsService);
  private readonly tasteService = inject(TasteService);
  private readonly auth = inject(AuthService);

  stats = signal<PlatformStats | null>(null);
  taste = signal<TasteProfile | null>(null);
  diary = signal<DiaryStats | null>(null);

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set(null),
    });
    const username = this.auth.currentUser()?.username;
    if (username) {
      this.tasteService.profile(username).subscribe({
        next: (taste) => this.taste.set(taste),
        error: () => this.taste.set(null),
      });
      this.tasteService.diary(username).subscribe({
        next: (diary) => this.diary.set(diary),
        error: () => this.diary.set(null),
      });
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

  barWidth(count: number, distribution: number[]): number {
    const max = Math.max(...distribution, 1);
    return Math.round((count / max) * 100);
  }
}
