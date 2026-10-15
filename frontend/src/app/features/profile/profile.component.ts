import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LucideLock, LucideTrophy, LucideUserCheck, LucideUserPlus, LucideUsers, LucidePenLine, LucideClock } from '@lucide/angular';
import { UserService } from '../../core/services/user.service';
import { ReviewService } from '../../core/services/review.service';
import { FollowService } from '../../core/services/follow.service';
import { TasteService, TasteProfile, Compatibility } from '../../core/services/taste.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { ListService } from '../../core/services/list.service';
import { UiService } from '../../core/services/ui.service';
import { User } from '../../core/models/user.model';
import { Review } from '../../core/models/review.model';
import { MediaItem } from '../../core/models/media-item.model';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TasteProfileComponent } from '../../shared/components/taste-profile/taste-profile.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { UserRowComponent } from '../../shared/components/user-row/user-row.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { mediaLink } from '../../core/utils/media-link';
import { errorMessage } from '../../core/utils/http-error';

type ProfileTab = 'reviews' | 'watched' | 'watchlist' | 'followers' | 'following';

@Component({
  selector: 'app-profile',
  imports: [
    RouterLink,
    TranslatePipe,
    ReviewCardComponent,
    EmptyStateComponent,
    TasteProfileComponent,
    AvatarComponent,
    MediaCardComponent,
    UserRowComponent,
    StarRatingComponent,
    PosterComponent,
    LucideUserPlus,
    LucideUserCheck,
    LucideTrophy,
    LucideLock,
    LucideUsers,
    LucidePenLine,
    LucideClock,
  ],
  template: `
    @if (user(); as person) {
      <section class="flex flex-col gap-5 sm:flex-row sm:items-end">
        <app-avatar [name]="person.username" [url]="person.avatarUrl" [size]="104" class="ring-4 ring-bg" />
        <div class="min-w-0 flex-1">
          <h1 class="font-display text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold uppercase leading-[0.88]">{{ person.fullName || person.username }}</h1>
          <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            <span>&#64;{{ person.username }}</span>
            @if (person.profilePublic === false) {
              <span class="inline-flex items-center gap-1 text-[13px]"><svg lucideLock [size]="13" /> {{ 'profile.private' | translate }}</span>
            }
            @if (compatibility()?.percent != null) {
              <span class="tag bg-brass/15 text-[12px] text-brass-ink">{{ 'profile.matchBadge' | translate: { percent: compatibility()!.percent! } }}</span>
            }
          </p>
          @if (person.bio) {
            <p class="mt-3 max-w-[58ch] leading-relaxed text-text/90">{{ person.bio }}</p>
          }
        </div>
        <div class="flex shrink-0 gap-2">
          @if (isOwnProfile()) {
            <a routerLink="/settings" class="btn-secondary">{{ 'profile.editProfile' | translate }}</a>
          } @else if (auth.isLoggedIn()) {
            @if (person.following) {
              <button type="button" class="btn-secondary group min-w-[8.5rem]" (click)="toggleFollow()" [disabled]="busy()">
                <svg lucideUserCheck [size]="17" />
                <span class="group-hover:hidden">{{ 'profile.following' | translate }}</span>
                <span class="hidden group-hover:inline">{{ 'profile.unfollow' | translate }}</span>
              </button>
            } @else if (person.followRequested) {
              <button type="button" class="btn-secondary" (click)="toggleFollow()" [disabled]="busy()">
                <svg lucideClock [size]="17" /> {{ 'profile.requested' | translate }}
              </button>
            } @else {
              <button type="button" class="btn-primary" (click)="toggleFollow()" [disabled]="busy()">
                <svg lucideUserPlus [size]="17" /> {{ 'profile.follow' | translate }}
              </button>
            }
          } @else {
            <a routerLink="/auth/login" class="btn-primary"><svg lucideUserPlus [size]="17" /> {{ 'profile.follow' | translate }}</a>
          }
        </div>
      </section>

      <div class="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border/70 bg-border/70 sm:grid-cols-4">
        <div class="bg-surface px-4 py-3">
          <span class="block text-[13px] text-muted">{{ 'profile.logged' | translate }}</span>
          <span class="block font-display text-3xl font-bold tabular-nums leading-tight">{{ reviews().length }}</span>
        </div>
        <button type="button" class="bg-surface px-4 py-3 text-left hover:bg-elevated" (click)="setTab('followers')">
          <span class="block text-[13px] text-muted">{{ 'profile.followersLabel' | translate }}</span>
          <span class="block font-display text-3xl font-bold tabular-nums leading-tight">{{ person.followerCount ?? 0 }}</span>
        </button>
        <button type="button" class="bg-surface px-4 py-3 text-left hover:bg-elevated" (click)="setTab('following')">
          <span class="block text-[13px] text-muted">{{ 'profile.followingLabel' | translate }}</span>
          <span class="block font-display text-3xl font-bold tabular-nums leading-tight">{{ person.followingCount ?? 0 }}</span>
        </button>
        <div class="bg-surface px-4 py-3">
          <span class="block inline-flex items-center gap-1 text-[13px] text-muted"><svg lucideTrophy [size]="13" /> {{ 'profile.points' | translate }}</span>
          <span class="block font-display text-3xl font-bold tabular-nums leading-tight">{{ person.gainedChallengePoints ?? 0 }}</span>
        </div>
      </div>

      @if (recent().length) {
        <section class="mt-10">
          <h2 class="section-title mb-4">{{ 'profile.recent' | translate }}</h2>
          <div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
            @for (review of recent(); track review.id) {
              <a [routerLink]="link(review).commands" [queryParams]="link(review).queryParams" class="group block">
                <app-poster class="aspect-[2/3] overflow-hidden rounded-[4px] shadow-poster ring-brass/70 transition group-hover:ring-2" [title]="review.movie?.title ?? ''" [src]="review.movie?.posterApiLink" [mediaType]="review.movie?.mediaType" [year]="review.movie?.year" />
                @if (review.rating) {
                  <app-star-rating class="mt-1.5" [value]="review.rating" [size]="11" />
                }
              </a>
            }
          </div>
        </section>
      }

      <div class="mt-10">
        <app-taste-profile [profile]="taste()" />
      </div>

      <div class="tabs mt-10" role="tablist">
        @for (tab of visibleTabs(); track tab.id) {
          <button type="button" role="tab" class="tab" [class.tab-active]="activeTab() === tab.id" [attr.aria-selected]="activeTab() === tab.id" (click)="setTab(tab.id)">
            {{ tab.labelKey | translate }}
          </button>
        }
      </div>

      <div class="mt-4">
        @switch (activeTab()) {
          @case ('reviews') {
            @if (reviews().length === 0) {
              <app-empty-state [message]="'profile.emptyReviews' | translate" [hint]="(isOwnProfile() ? 'profile.emptyReviewsOwn' : 'profile.emptyReviewsOther') | translate">
                <svg emptyIcon lucidePenLine [size]="26" />
                @if (isOwnProfile()) {
                  <button type="button" class="btn-primary" (click)="ui.openReview()">{{ 'home.writeReview' | translate }}</button>
                }
              </app-empty-state>
            } @else {
              @for (review of reviews(); track review.id) {
                <app-review-card [review]="review" [showAuthor]="false" (deleted)="reload()" (updated)="reload()" />
              }
            }
          }
          @case ('watched') {
            @if (watched().length === 0) {
              <app-empty-state [message]="'profile.emptyReviews' | translate"><svg emptyIcon lucidePenLine [size]="26" /></app-empty-state>
            } @else {
              <div class="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
                @for (item of watched(); track item.id ?? item.externalKey ?? item.title) {
                  <app-media-card [item]="item" />
                }
              </div>
            }
          }
          @case ('watchlist') {
            @if (watchlist().length === 0) {
              <app-empty-state [message]="'profile.emptyWatchlist' | translate" [hint]="'watchlist.emptyHint' | translate"><svg emptyIcon lucidePenLine [size]="26" /></app-empty-state>
            } @else {
              <div class="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
                @for (item of watchlist(); track item.id ?? item.tmdbId ?? item.title) {
                  <app-media-card [item]="item" />
                }
              </div>
            }
          }
          @case ('followers') {
            @if (people().length === 0) {
              <app-empty-state [message]="'profile.emptyFollowers' | translate"><svg emptyIcon lucideUsers [size]="26" /></app-empty-state>
            } @else {
              <div class="divide-y divide-border/60">
                @for (p of people(); track p.id) { <app-user-row [user]="p" /> }
              </div>
            }
          }
          @case ('following') {
            @if (people().length === 0) {
              <app-empty-state [message]="'profile.emptyFollowing' | translate"><svg emptyIcon lucideUsers [size]="26" /></app-empty-state>
            } @else {
              <div class="divide-y divide-border/60">
                @for (p of people(); track p.id) { <app-user-row [user]="p" /> }
              </div>
            }
          }
        }
      </div>
    } @else if (loading()) {
      <div class="flex items-end gap-5" aria-busy="true">
        <div class="skeleton h-[104px] w-[104px] rounded-full"></div>
        <div class="flex-1 space-y-3">
          <div class="skeleton h-12 w-1/2"></div>
          <div class="skeleton h-4 w-1/4"></div>
        </div>
      </div>
      <div class="skeleton mt-8 h-20 w-full"></div>
    } @else {
      <app-empty-state [message]="'profile.notFound' | translate" [hint]="'profile.notFoundHint' | translate">
        <svg emptyIcon lucideUsers [size]="26" />
        <a routerLink="/people" class="btn-primary">{{ 'nav.people' | translate }}</a>
      </app-empty-state>
    }
  `,
})
export class ProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly userService = inject(UserService);
  private readonly reviewService = inject(ReviewService);
  private readonly followService = inject(FollowService);
  private readonly listService = inject(ListService);
  private readonly tasteService = inject(TasteService);
  readonly auth = inject(AuthService);
  readonly ui = inject(UiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = signal<User | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly people = signal<User[]>([]);
  readonly watchlist = signal<MediaItem[]>([]);
  readonly taste = signal<TasteProfile | null>(null);
  readonly compatibility = signal<Compatibility | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly activeTab = signal<ProfileTab>('reviews');

  readonly recent = computed(() => this.reviews().slice(0, 6));
  readonly watched = computed(() => {
    const seen = new Set<string>();
    return this.reviews()
      .map((r) => r.movie)
      .filter((m): m is MediaItem => !!m)
      .filter((m) => {
        const key = String(m.id ?? m.externalKey ?? m.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  });
  readonly isOwnProfile = computed(() => !!this.user() && this.auth.currentUser()?.username === this.user()?.username);

  private readonly tabs: { id: ProfileTab; labelKey: string }[] = [
    { id: 'reviews', labelKey: 'profile.tabReviews' },
    { id: 'watched', labelKey: 'profile.tabWatched' },
    { id: 'watchlist', labelKey: 'profile.tabWatchlist' },
    { id: 'followers', labelKey: 'profile.tabFollowers' },
    { id: 'following', labelKey: 'profile.tabFollowing' },
  ];

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const username = params.get('username');
      if (username) this.loadProfile(username);
    });
    this.ui.reviewPublished$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.isOwnProfile()) this.reload();
    });
  }

  visibleTabs() {
    return this.isOwnProfile() ? this.tabs : this.tabs.filter((tab) => tab.id !== 'watchlist');
  }

  link(review: Review) {
    return mediaLink(review.movie);
  }

  setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    const username = this.user()?.username;
    if (!username) return;
    if (tab === 'watchlist' && this.isOwnProfile()) {
      this.listService.getWatchlist().subscribe({
        next: (list) => this.watchlist.set(list.movies ?? []),
        error: () => this.watchlist.set([]),
      });
    } else if (tab === 'followers' || tab === 'following') {
      this.people.set([]);
      const request = tab === 'followers' ? this.followService.getFollowers(username) : this.followService.getFollowing(username);
      request.subscribe({ next: (p) => this.people.set(p), error: () => this.people.set([]) });
    }
  }

  reload(): void {
    const username = this.user()?.username;
    if (!username) return;
    this.reviewService.getByUser(username, 0, 100).subscribe({ next: (r) => this.reviews.set(r), error: () => undefined });
    this.tasteService.profile(username).subscribe({ next: (t) => this.taste.set(t), error: () => undefined });
  }

  toggleFollow(): void {
    const user = this.user();
    if (!user || this.busy()) return;
    const leaving = user.following || user.followRequested;
    this.busy.set(true);
    const action = leaving ? this.followService.unfollow(user.username) : this.followService.follow(user.username);
    action.subscribe({
      next: () => {
        // Re-read the profile so counts and the follow state come from the server.
        this.userService.getProfile(user.username).subscribe({
          next: (fresh) => {
            this.user.set(fresh);
            this.busy.set(false);
            const key = leaving ? 'profile.unfollowed' : fresh.following ? 'profile.nowFollowing' : 'profile.followRequestSent';
            this.toast.success(this.i18n.translate(key, { username: user.username }));
          },
          error: () => this.busy.set(false),
        });
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(errorMessage(err, this.i18n.translate('common.actionFailed')));
      },
    });
  }

  private loadProfile(username: string): void {
    this.loading.set(true);
    this.user.set(null);
    this.reviews.set([]);
    this.taste.set(null);
    this.compatibility.set(null);
    this.activeTab.set('reviews');
    this.userService.getProfile(username).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.titleService.setTitle(`${user.fullName || user.username} (@${user.username}) · CritiComrade`);
        this.reload();
        if (this.auth.isLoggedIn() && this.auth.currentUser()?.username !== username) {
          this.tasteService.compatibility(username).subscribe({
            next: (score) => this.compatibility.set(score),
            error: () => this.compatibility.set(null),
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
