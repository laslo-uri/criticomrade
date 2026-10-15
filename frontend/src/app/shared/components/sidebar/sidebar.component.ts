import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBell,
  LucideBookOpen,
  LucideBookmark,
  LucideChartColumn,
  LucideCompass,
  LucideHouse,
  LucideLibrary,
  LucidePenLine,
  LucideSettings,
  LucideSwords,
  LucideUsers,
} from '@lucide/angular';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UiService } from '../../../core/services/ui.service';

type Icon = 'home' | 'compass' | 'book' | 'bookmark' | 'list' | 'swords' | 'bell' | 'settings' | 'chart' | 'users';

interface NavItem {
  labelKey: string;
  route: string;
  icon: Icon;
  exact?: boolean;
  auth?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LucideHouse,
    LucideCompass,
    LucideBookOpen,
    LucideBookmark,
    LucideLibrary,
    LucideSwords,
    LucideBell,
    LucideSettings,
    LucideChartColumn,
    LucideUsers,
    LucidePenLine,
  ],
  template: `
    <nav class="sticky top-16 flex max-h-[calc(100dvh-4rem)] flex-col gap-0.5 overflow-y-auto py-6 pr-3" [attr.aria-label]="'nav.menu' | translate">
      @if (auth.isLoggedIn()) {
        <button type="button" class="btn-primary mb-5 w-full justify-start gap-2.5 !px-4" (click)="ui.openReview()">
          <svg lucidePenLine [size]="18" /> {{ 'nav.logTitle' | translate }}
        </button>
      }
      @for (item of items(); track item.route) {
        <a [routerLink]="item.route" routerLinkActive="nav-link-active" [routerLinkActiveOptions]="{ exact: item.exact ?? false }" class="nav-link">
          @switch (item.icon) {
            @case ('home') { <svg lucideHouse [size]="19" /> }
            @case ('compass') { <svg lucideCompass [size]="19" /> }
            @case ('book') { <svg lucideBookOpen [size]="19" /> }
            @case ('bookmark') { <svg lucideBookmark [size]="19" /> }
            @case ('list') { <svg lucideLibrary [size]="19" /> }
            @case ('swords') { <svg lucideSwords [size]="19" /> }
            @case ('chart') { <svg lucideChartColumn [size]="19" /> }
            @case ('users') { <svg lucideUsers [size]="19" /> }
            @case ('bell') { <svg lucideBell [size]="19" /> }
            @case ('settings') { <svg lucideSettings [size]="19" /> }
          }
          <span class="flex-1">{{ item.labelKey | translate }}</span>
          @if (item.icon === 'bell' && notifications.unread() > 0) {
            <span class="rounded-full bg-accent px-1.5 text-[11px] font-bold leading-[18px] text-paper">{{ notifications.unread() }}</span>
          }
        </a>
        @if (item.route === '/stats') {
          <div class="my-3 h-px bg-border/70" role="separator"></div>
        }
      }
      @if (!auth.isLoggedIn()) {
        <div class="mt-6 rounded-panel border border-border/70 bg-surface p-4">
          <p class="font-display text-xl font-bold uppercase leading-none">{{ 'sidebar.joinTitle' | translate }}</p>
          <p class="mt-2 text-sm text-muted">{{ 'sidebar.joinText' | translate }}</p>
          <a routerLink="/auth/register" class="btn-primary btn-sm mt-3 w-full">{{ 'nav.signUp' | translate }}</a>
        </div>
      }
    </nav>
  `,
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly ui = inject(UiService);

  private readonly all: NavItem[] = [
    { labelKey: 'nav.home', route: '/', icon: 'home', exact: true, auth: true },
    { labelKey: 'nav.explore', route: '/explore', icon: 'compass' },
    { labelKey: 'nav.people', route: '/people', icon: 'users' },
    { labelKey: 'nav.stats', route: '/stats', icon: 'chart' },
    { labelKey: 'nav.diary', route: '/diary', icon: 'book', auth: true },
    { labelKey: 'nav.watchlist', route: '/watchlist', icon: 'bookmark', auth: true },
    { labelKey: 'nav.lists', route: '/lists', icon: 'list', auth: true },
    { labelKey: 'nav.recommendations', route: '/recommendations', icon: 'swords', auth: true },
    { labelKey: 'nav.notifications', route: '/notifications', icon: 'bell', auth: true },
    { labelKey: 'nav.settings', route: '/settings', icon: 'settings', auth: true },
  ];

  items(): NavItem[] {
    return this.auth.isLoggedIn() ? this.all : this.all.filter((i) => !i.auth);
  }
}
