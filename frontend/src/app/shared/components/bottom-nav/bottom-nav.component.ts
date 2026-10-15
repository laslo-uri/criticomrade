import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBell,
  LucideChartColumn,
  LucideCompass,
  LucideHouse,
  LucidePlus,
  LucideUser,
  LucideUsers,
} from '@lucide/angular';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UiService } from '../../../core/services/ui.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LucideHouse, LucideCompass, LucideBell, LucideUser, LucidePlus, LucideUsers, LucideChartColumn],
  template: `
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-bg/90 pb-safe backdrop-blur-md md:hidden"
      [attr.aria-label]="'nav.menu' | translate"
    >
      <div class="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        @if (auth.isLoggedIn()) {
          <a routerLink="/" routerLinkActive="bottom-nav-active" [routerLinkActiveOptions]="{ exact: true }" class="bottom-nav-item">
            <svg lucideHouse [size]="22" /> {{ 'nav.home' | translate }}
          </a>
          <a routerLink="/explore" routerLinkActive="bottom-nav-active" class="bottom-nav-item">
            <svg lucideCompass [size]="22" /> {{ 'nav.explore' | translate }}
          </a>
          <button type="button" class="bottom-nav-item" (click)="ui.openReview()" [attr.aria-label]="'nav.logTitle' | translate">
            <span class="flex h-[22px] w-11 items-center justify-center rounded-full bg-accent text-paper shadow-poster">
              <svg lucidePlus [size]="18" />
            </span>
            {{ 'nav.log' | translate }}
          </button>
          <a routerLink="/notifications" routerLinkActive="bottom-nav-active" class="bottom-nav-item relative">
            <svg lucideBell [size]="22" />
            @if (notifications.unread() > 0) {
              <span class="absolute right-3 top-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-bg" aria-hidden="true"></span>
            }
            {{ 'nav.alerts' | translate }}
          </a>
          <a [routerLink]="profileRoute()" routerLinkActive="bottom-nav-active" class="bottom-nav-item">
            <svg lucideUser [size]="22" /> {{ 'nav.profile' | translate }}
          </a>
        } @else {
          <a routerLink="/explore" routerLinkActive="bottom-nav-active" class="bottom-nav-item">
            <svg lucideCompass [size]="22" /> {{ 'nav.explore' | translate }}
          </a>
          <a routerLink="/people" routerLinkActive="bottom-nav-active" class="bottom-nav-item">
            <svg lucideUsers [size]="22" /> {{ 'nav.people' | translate }}
          </a>
          <a routerLink="/stats" routerLinkActive="bottom-nav-active" class="bottom-nav-item">
            <svg lucideChartColumn [size]="22" /> {{ 'nav.stats' | translate }}
          </a>
          <a routerLink="/auth/login" routerLinkActive="bottom-nav-active" class="bottom-nav-item">
            <svg lucideUser [size]="22" /> {{ 'nav.logIn' | translate }}
          </a>
        }
      </div>
    </nav>
  `,
})
export class BottomNavComponent {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly ui = inject(UiService);
  readonly profileRoute = computed(() => {
    const username = this.auth.currentUser()?.username;
    return username ? `/profile/${username}` : '/auth/login';
  });
}
