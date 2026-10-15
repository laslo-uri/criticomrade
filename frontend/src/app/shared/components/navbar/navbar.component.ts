import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideBell,
  LucideLogOut,
  LucideMoon,
  LucideSearch,
  LucideSettings,
  LucideSun,
  LucideUser,
  LucideX,
} from '@lucide/angular';
import { LogoComponent } from '../logo/logo.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule,
    TranslatePipe,
    LucideSearch,
    LucideBell,
    LucideUser,
    LucideSettings,
    LucideLogOut,
    LucideMoon,
    LucideSun,
    LucideX,
    LogoComponent,
    AvatarComponent,
  ],
  template: `
    <header class="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div class="mx-auto flex h-16 max-w-page items-center gap-3 px-4 lg:px-6">
        @if (!searchOpen()) {
          <app-logo variant="nav" />
        }

        <form
          role="search"
          class="flex-1 justify-center md:flex"
          [class.hidden]="!searchOpen()"
          [class.flex]="searchOpen()"
          (submit)="onSearch($event)"
        >
          <label class="relative w-full max-w-md">
            <span class="sr-only">{{ 'common.searchMedia' | translate }}</span>
            <svg lucideSearch [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              #searchInput
              type="search"
              name="q"
              class="input-field !min-h-10 !rounded-full !py-2 pl-10"
              [placeholder]="'common.searchMedia' | translate"
              [(ngModel)]="query"
              autocomplete="off"
              enterkeyhint="search"
            />
          </label>
        </form>

        <div class="ml-auto flex items-center gap-1 md:ml-0">
          @if (searchOpen()) {
            <button type="button" class="icon-btn md:hidden" (click)="searchOpen.set(false)" [attr.aria-label]="'common.close' | translate">
              <svg lucideX [size]="20" />
            </button>
          } @else {
            <button type="button" class="icon-btn md:hidden" (click)="openSearch()" [attr.aria-label]="'common.searchMedia' | translate">
              <svg lucideSearch [size]="20" />
            </button>
          }

          <button
            type="button"
            class="icon-btn hidden sm:inline-flex"
            (click)="theme.toggle()"
            [attr.aria-label]="(theme.theme() === 'dark' ? 'settings.themeLight' : 'settings.themeDark') | translate"
          >
            @if (theme.theme() === 'dark') { <svg lucideSun [size]="19" /> } @else { <svg lucideMoon [size]="19" /> }
          </button>

          @if (auth.isLoggedIn()) {
            <a
              routerLink="/notifications"
              routerLinkActive="!text-text bg-elevated"
              class="icon-btn relative"
              [attr.aria-label]="'nav.notificationsAria' | translate: { count: notifications.unread() }"
            >
              <svg lucideBell [size]="20" />
              @if (notifications.unread() > 0) {
                <span class="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10.5px] font-bold leading-none text-paper ring-2 ring-bg">
                  {{ notifications.unread() > 9 ? '9+' : notifications.unread() }}
                </span>
              }
            </a>

            <div class="relative" #menuRoot>
              <button
                type="button"
                class="ml-1 flex items-center rounded-full ring-offset-2 ring-offset-bg transition hover:ring-2 hover:ring-border"
                [attr.aria-expanded]="menuOpen()"
                aria-haspopup="menu"
                [attr.aria-label]="'nav.accountMenu' | translate"
                (click)="menuOpen.set(!menuOpen())"
              >
                <app-avatar [name]="auth.currentUser()?.username" [url]="auth.currentUser()?.avatarUrl" [size]="36" />
              </button>
              @if (menuOpen()) {
                <div class="motion-pop absolute right-0 mt-2 w-60 overflow-hidden rounded-panel border border-border bg-surface py-1.5 shadow-lift" role="menu">
                  <div class="border-b border-border/70 px-4 pb-2.5 pt-1.5">
                    <p class="truncate font-semibold">{{ auth.currentUser()?.fullName || auth.currentUser()?.username }}</p>
                    <p class="truncate text-sm text-muted">&#64;{{ auth.currentUser()?.username }}</p>
                  </div>
                  <a role="menuitem" [routerLink]="['/profile', auth.currentUser()?.username]" class="menu-item" (click)="menuOpen.set(false)">
                    <svg lucideUser [size]="17" /> {{ 'nav.profile' | translate }}
                  </a>
                  <a role="menuitem" routerLink="/settings" class="menu-item" (click)="menuOpen.set(false)">
                    <svg lucideSettings [size]="17" /> {{ 'nav.settings' | translate }}
                  </a>
                  <button role="menuitem" type="button" class="menu-item w-full sm:hidden" (click)="theme.toggle()">
                    @if (theme.theme() === 'dark') { <svg lucideSun [size]="17" /> } @else { <svg lucideMoon [size]="17" /> }
                    {{ (theme.theme() === 'dark' ? 'settings.themeLight' : 'settings.themeDark') | translate }}
                  </button>
                  <button role="menuitem" type="button" class="menu-item w-full" (click)="logout()">
                    <svg lucideLogOut [size]="17" /> {{ 'nav.logOut' | translate }}
                  </button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/auth/login" class="btn-ghost btn-sm hidden sm:inline-flex">{{ 'nav.logIn' | translate }}</a>
            <a routerLink="/auth/register" class="btn-primary btn-sm">{{ 'nav.signUp' | translate }}</a>
          }
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly menuRoot = viewChild<ElementRef<HTMLElement>>('menuRoot');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  query = '';
  readonly menuOpen = signal(false);
  readonly searchOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.menuRoot()?.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
    this.searchOpen.set(false);
  }

  openSearch(): void {
    this.searchOpen.set(true);
    setTimeout(() => this.searchInput()?.nativeElement.focus());
  }

  onSearch(event: Event): void {
    event.preventDefault();
    const q = this.query.trim();
    if (!q) return;
    this.router.navigate(['/explore'], { queryParams: { q } });
    this.searchOpen.set(false);
    this.searchInput()?.nativeElement.blur();
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/', { onSameUrlNavigation: 'reload' });
  }
}
