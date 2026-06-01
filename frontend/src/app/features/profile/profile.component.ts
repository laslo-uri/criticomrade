import { Component, inject, signal } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { LucideUser } from '@lucide/angular';

import { UserService } from '../../core/services/user.service';

import { ReviewService } from '../../core/services/review.service';

import { FollowService } from '../../core/services/follow.service';

import { AuthService } from '../../core/services/auth.service';

import { ToastService } from '../../core/services/toast.service';

import { TranslationService } from '../../core/services/translation.service';

import { User as UserModel } from '../../core/models/user.model';

import { Review } from '../../core/models/review.model';

import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';

import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

import { TranslatePipe } from '../../core/pipes/translate.pipe';



type ProfileTab = 'reviews' | 'followers' | 'following';



@Component({
    selector: 'app-profile',
    imports: [RouterLink, TranslatePipe, LucideUser, ReviewCardComponent, EmptyStateComponent],
    template: `

    @if (user()) {

      <div class="space-y-6">

        <section class="card flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">

          @if (user()!.avatarUrl) {

            <img [src]="user()!.avatarUrl" alt="" class="h-24 w-24 rounded-full object-cover" />

          } @else {

            <div class="flex h-24 w-24 items-center justify-center rounded-full bg-elevated text-2xl font-bold">

              {{ user()!.username.charAt(0).toUpperCase() }}

            </div>

          }

          <div class="flex-1">

            <h1 class="text-2xl font-bold">{{ user()!.fullName || user()!.username }}</h1>

            <p class="text-muted">{{ '@' + user()!.username }}</p>

            @if (user()!.bio) {

              <p class="mt-2 text-sm">{{ user()!.bio }}</p>

            }

            <div class="mt-3 flex justify-center gap-6 text-sm sm:justify-start">

              <span><strong>{{ user()!.followerCount ?? 0 }}</strong> {{ 'profile.followers' | translate }}</span>

              <span><strong>{{ user()!.followingCount ?? 0 }}</strong> {{ 'profile.following' | translate }}</span>

            </div>

          </div>

          @if (isOwnProfile()) {

            <a routerLink="/settings" class="btn-secondary">{{ 'profile.editProfile' | translate }}</a>

          } @else if (auth.isLoggedIn()) {

            <button type="button" class="btn-primary" (click)="toggleFollow()">

              {{ (user()!.following ? 'profile.unfollow' : 'profile.follow') | translate }}

            </button>

          }

        </section>



        <div class="flex gap-2 border-b border-border">

          @for (tab of tabs; track tab.id) {

            <button

              type="button"

              class="px-4 py-2 text-sm transition"

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

              <app-empty-state [message]="'profile.emptyReviews' | translate">

                <svg emptyIcon lucideUser [size]="48" class="mb-4 text-muted" />

              </app-empty-state>

            } @else {

              <div class="space-y-4">

                @for (review of reviews(); track review.id) {

                  <app-review-card [review]="review" />

                }

              </div>

            }

          }

          @case ('followers') {

            @if (followers().length === 0) {

              <app-empty-state [message]="'profile.emptyFollowers' | translate" />

            } @else {

              <ul class="space-y-2">

                @for (f of followers(); track f.id) {

                  <li>

                    <a [routerLink]="['/profile', f.username]" class="flex items-center gap-3 rounded-lg p-3 hover:bg-elevated">

                      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-sm font-medium">

                        {{ f.username.charAt(0).toUpperCase() }}

                      </div>

                      <span>{{ f.username }}</span>

                    </a>

                  </li>

                }

              </ul>

            }

          }

          @case ('following') {

            @if (following().length === 0) {

              <app-empty-state [message]="'profile.emptyFollowing' | translate" />

            } @else {

              <ul class="space-y-2">

                @for (f of following(); track f.id) {

                  <li>

                    <a [routerLink]="['/profile', f.username]" class="flex items-center gap-3 rounded-lg p-3 hover:bg-elevated">

                      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-sm font-medium">

                        {{ f.username.charAt(0).toUpperCase() }}

                      </div>

                      <span>{{ f.username }}</span>

                    </a>

                  </li>

                }

              </ul>

            }

          }

        }

      </div>

    } @else if (loading()) {

      <p class="py-16 text-center text-muted">{{ 'common.loading' | translate }}</p>

    }

  `
})

export class ProfileComponent {

  private readonly route = inject(ActivatedRoute);

  private readonly userService = inject(UserService);

  private readonly reviewService = inject(ReviewService);

  private readonly followService = inject(FollowService);

  readonly auth = inject(AuthService);

  private readonly toast = inject(ToastService);

  private readonly translationService = inject(TranslationService);



  user = signal<UserModel | null>(null);

  reviews = signal<Review[]>([]);

  followers = signal<UserModel[]>([]);

  following = signal<UserModel[]>([]);

  loading = signal(true);

  activeTab = signal<ProfileTab>('reviews');



  readonly tabs: { id: ProfileTab; labelKey: string }[] = [

    { id: 'reviews', labelKey: 'profile.tabReviews' },

    { id: 'followers', labelKey: 'profile.tabFollowers' },

    { id: 'following', labelKey: 'profile.tabFollowing' },

  ];



  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      const username = params.get('username');

      if (username) {

        this.loadProfile(username);

      }

    });

  }



  isOwnProfile(): boolean {

    return this.auth.currentUser()?.username === this.user()?.username;

  }



  setTab(tab: ProfileTab): void {

    this.activeTab.set(tab);

    const username = this.user()?.username;

    if (!username) return;

    if (tab === 'followers') {

      this.followService.getFollowers(username).subscribe((f) => this.followers.set(f));

    } else if (tab === 'following') {

      this.followService.getFollowing(username).subscribe((f) => this.following.set(f));

    }

  }



  toggleFollow(): void {

    const user = this.user();

    if (!user) return;

    const wasFollowing = user.following;

    const action = wasFollowing

      ? this.followService.unfollow(user.username)

      : this.followService.follow(user.username);

    action.subscribe({

      next: () => {

        this.user.update((u) =>

          u ? { ...u, following: !u.following } : u

        );

        this.toast.success(

          this.translationService.translate(wasFollowing ? 'profile.unfollowed' : 'profile.followRequestSent')

        );

      },

      error: () => this.toast.error(this.translationService.translate('profile.actionFailed')),

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

        });

      },

      error: () => this.loading.set(false),

    });

  }

}

