import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ReviewService } from '../../core/services/review.service';
import { FollowService } from '../../core/services/follow.service';
import { TasteService, TasteProfile, Compatibility } from '../../core/services/taste.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { User as UserModel } from '../../core/models/user.model';
import { Review } from '../../core/models/review.model';
import { MediaItem } from '../../core/models/media-item.model';
import { ListService } from '../../core/services/list.service';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TasteProfileComponent } from '../../shared/components/taste-profile/taste-profile.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

type ProfileTab = 'reviews' | 'watched' | 'watchlist' | 'followers' | 'following';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, TranslatePipe, ReviewCardComponent, EmptyStateComponent, TasteProfileComponent, NgTemplateOutlet],
  template: `
    @if (user(); as person) {
      <div class="space-y-6">
        <section class="overflow-hidden rounded-xl border border-white/5 bg-surface">
          <div class="h-28 bg-gradient-to-r from-accent/80 to-secondary/70 sm:h-36"></div>
          <div class="flex flex-col gap-4 px-4 pb-5 sm:flex-row sm:items-end">
            <div class="-mt-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface bg-elevated text-2xl font-bold sm:h-24 sm:w-24">
              @if (person.avatarUrl) {
                <img [src]="person.avatarUrl" alt="" class="h-full w-full rounded-full object-cover" />
              } @else {
                {{ person.username.charAt(0).toUpperCase() }}
              }
            </div>
            <div class="min-w-0 flex-1">
              <h1 class="text-2xl font-bold">{{ person.fullName || person.username }}</h1>
              <p class="text-muted">@{{ person.username }}</p>
              @if (person.bio) { <p class="mt-2 text-sm">{{ person.bio }}</p> }
              <div class="mt-3 flex gap-5 text-sm">
                <span><strong>{{ person.followerCount ?? 0 }}</strong> {{ 'profile.followers' | translate }}</span>
                <span><strong>{{ person.followingCount ?? 0 }}</strong> {{ 'profile.following' | translate }}</span>
                @if (compatibility()?.percent != null) {
                  <span><strong>{{ compatibility()!.percent }}%</strong> {{ 'profile.compatibility' | translate }}</span>
                }
              </div>
            </div>
            @if (isOwnProfile()) {
              <a routerLink="/settings" class="btn-secondary min-h-11">{{ 'profile.editProfile' | translate }}</a>
            } @else if (auth.isLoggedIn()) {
              <button type="button" class="btn-primary min-h-11" (click)="toggleFollow()">
                {{ (person.following ? 'profile.unfollow' : 'profile.follow') | translate }}
              </button>
            }
          </div>
        </section>

        <app-taste-profile [profile]="taste()" />

        @if (recent().length) {
          <section>
            <h2 class="mb-3 text-lg font-semibold">{{ 'profile.recent' | translate }}</h2>
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              @for (review of recent(); track review.id) {
                <a [routerLink]="['/media', review.movie?.id]" class="block">
                  @if (review.movie?.posterApiLink) {
                    <img [src]="review.movie!.posterApiLink" [alt]="review.movie!.title" class="aspect-[2/3] w-full rounded-lg object-cover" />
                  }
                  <p class="mt-1 truncate text-xs">{{ review.movie?.title }}</p>
                </a>
              }
            </div>
          </section>
        }

        <div class="flex gap-2 overflow-x-auto border-b border-border">
          @for (tab of visibleTabs(); track tab.id) {
            <button
              type="button"
              class="min-h-11 shrink-0 px-3 text-sm"
              [class.border-b-2]="activeTab() === tab.id"
              [class.border-accent]="activeTab() === tab.id"
              [class.text-accent]="activeTab() === tab.id"
              [class.text-muted]="activeTab() !== tab.id"
              (click)="setTab(tab.id)"
            >
              {{ tab.labelKey | translate }}
            </button>
          }
        </div>

        @switch (activeTab()) {
          @case ('reviews') {
            @if (reviews().length === 0) {
              <app-empty-state [message]="'profile.emptyReviews' | translate" />
            } @else {
              <div class="space-y-4">
                @for (review of reviews(); track review.id) {
                  <app-review-card [review]="review" />
                }
              </div>
            }
          }
          @case ('watchlist') {
            @if (watchlist().length === 0) {
              <app-empty-state [message]="'profile.emptyWatchlist' | translate" />
            } @else {
              <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                @for (item of watchlist(); track item.id ?? item.tmdbId) {
                  <a [routerLink]="item.id ? ['/media', item.id] : ['/movies/tmdb', item.tmdbId]" class="block">
                    @if (item.posterApiLink) {
                      <img [src]="item.posterApiLink" [alt]="item.title" class="aspect-[2/3] w-full rounded-lg object-cover" />
                    }
                    <p class="mt-1 truncate text-sm">{{ item.title }}</p>
                  </a>
                }
              </div>
            }
          }
          @case ('watched') {
            @if (recent().length === 0) {
              <app-empty-state [message]="'profile.emptyReviews' | translate" />
            } @else {
              <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                @for (review of reviews(); track review.id) {
                  <a [routerLink]="['/media', review.movie?.id]" class="block">
                    @if (review.movie?.posterApiLink) {
                      <img [src]="review.movie!.posterApiLink" [alt]="review.movie!.title" class="aspect-[2/3] w-full rounded-lg object-cover" />
                    }
                    <p class="mt-1 truncate text-sm">{{ review.movie?.title }}</p>
                  </a>
                }
              </div>
            }
          }
          @case ('followers') { <ng-container *ngTemplateOutlet="people; context: { $implicit: followers() }" /> }
          @case ('following') { <ng-container *ngTemplateOutlet="people; context: { $implicit: following() }" /> }
        }
        <ng-template #people let-list>
          @if (list.length === 0) {
            <app-empty-state [message]="'profile.emptyFollowers' | translate" />
          } @else {
            <ul class="space-y-2">
              @for (f of list; track f.id) {
                <li>
                  <a [routerLink]="['/profile', f.username]" class="flex min-h-11 items-center gap-3 rounded-lg p-3 hover:bg-elevated">
                    <span class="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-sm font-medium">{{ f.username.charAt(0).toUpperCase() }}</span>
                    {{ f.username }}
                  </a>
                </li>
              }
            </ul>
          }
        </ng-template>
      </div>
    } @else if (loading()) {
      <div class="space-y-3">
        <div class="skeleton h-36 w-full"></div>
        <div class="skeleton h-8 w-1/3"></div>
      </div>
    }
  `,
})
export class ProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly reviewService = inject(ReviewService);
  private readonly followService = inject(FollowService);
  private readonly listService = inject(ListService);
  private readonly tasteService = inject(TasteService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);

  user = signal<UserModel | null>(null);
  reviews = signal<Review[]>([]);
  recent = signal<Review[]>([]);
  followers = signal<UserModel[]>([]);
  watchlist = signal<MediaItem[]>([]);
  following = signal<UserModel[]>([]);
  taste = signal<TasteProfile | null>(null);
  compatibility = signal<Compatibility | null>(null);
  loading = signal(true);
  activeTab = signal<ProfileTab>('reviews');

  readonly tabs: { id: ProfileTab; labelKey: string }[] = [
    { id: 'reviews', labelKey: 'profile.tabReviews' },
    { id: 'watched', labelKey: 'profile.tabWatched' },
    { id: 'watchlist', labelKey: 'profile.tabWatchlist' },
    { id: 'followers', labelKey: 'profile.tabFollowers' },
    { id: 'following', labelKey: 'profile.tabFollowing' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const username = params.get('username');
      if (username) this.loadProfile(username);
    });
  }

  visibleTabs(): { id: ProfileTab; labelKey: string }[] {
    return this.isOwnProfile() ? this.tabs : this.tabs.filter((tab) => tab.id !== 'watchlist');
  }

  isOwnProfile(): boolean {
    return this.auth.currentUser()?.username === this.user()?.username;
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
    } else if (tab === 'followers') {
      this.followService.getFollowers(username).subscribe((people) => this.followers.set(people));
    } else if (tab === 'following') {
      this.followService.getFollowing(username).subscribe((people) => this.following.set(people));
    }
  }

  toggleFollow(): void {
    const user = this.user();
    if (!user) return;
    const wasFollowing = user.following;
    const action = wasFollowing ? this.followService.unfollow(user.username) : this.followService.follow(user.username);
    action.subscribe({
      next: () => {
        this.user.update((current) => current ? { ...current, following: !current.following } : current);
        this.toast.success(this.i18n.translate(wasFollowing ? 'profile.unfollowed' : 'profile.followRequestSent'));
      },
      error: () => this.toast.error(this.i18n.translate('profile.actionFailed')),
    });
  }

  private loadProfile(username: string): void {
    this.loading.set(true);
    this.userService.getProfile(username).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.reviewService.getByUser(username).subscribe((reviews) => {
          this.reviews.set(reviews);
          this.recent.set(reviews.slice(0, 6));
        });
        this.tasteService.profile(username).subscribe({
          next: (taste) => this.taste.set(taste),
          error: () => this.taste.set(null),
        });
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
