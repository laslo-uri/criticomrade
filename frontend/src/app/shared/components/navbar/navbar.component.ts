import { Component, inject, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { FormsModule } from '@angular/forms';

import {

  LucideBell,

  LucideLogOut,

  LucideSearch,

  LucideSettings,

  LucideUser,

} from '@lucide/angular';

import { LogoComponent } from '../logo/logo.component';

import { AuthService } from '../../../core/services/auth.service';

import { NotificationService } from '../../../core/services/notification.service';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';



@Component({
    selector: 'app-navbar',
    imports: [
        RouterLink,
        FormsModule,
        TranslatePipe,
        LucideSearch,
        LucideBell,
        LucideUser,
        LucideSettings,
        LucideLogOut,
        LogoComponent,
    ],
    template: `

    <header

      class="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md"

    >

      <div class="mx-auto flex h-[3.75rem] max-w-7xl items-center gap-4 px-4 lg:px-6">

        <app-logo variant="nav" />



        <form

          class="hidden flex-1 justify-center md:flex"

          (submit)="onSearch($event)"

        >

          <div class="relative w-full max-w-sm">

            <svg

              lucideSearch

              [size]="16"

              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"

            />

            <input

              type="search"

              class="input-field !py-2.5 pl-9"

              [placeholder]="'common.searchMovies' | translate"

              [(ngModel)]="searchQuery"

              name="search"

            />

          </div>

        </form>



        <div class="ml-auto flex items-center gap-1.5">

          @if (auth.isLoggedIn()) {

            <a

              routerLink="/notifications"

              class="relative rounded-lg p-2.5 text-muted transition hover:bg-elevated hover:text-text"

              [attr.aria-label]="'nav.notificationsAria' | translate"

            >

              <svg lucideBell [size]="20" />

              @if (unreadCount() > 0) {

                <span

                  class="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white"

                >

                  {{ unreadCount() > 9 ? '9+' : unreadCount() }}

                </span>

              }

            </a>



            <div class="relative">

              <button

                type="button"

                class="flex items-center gap-2 rounded-lg p-1 transition hover:bg-elevated"

                (click)="menuOpen.set(!menuOpen())"

              >

                @if (auth.currentUser()?.avatarUrl) {

                  <img

                    [src]="auth.currentUser()!.avatarUrl"

                    alt=""

                    class="h-8 w-8 rounded-full object-cover"

                  />

                } @else {

                  <div

                    class="avatar-ring flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-secondary/20 text-sm font-semibold text-text"

                  >

                    {{ auth.currentUser()?.username?.charAt(0)?.toUpperCase() }}

                  </div>

                }

              </button>

              @if (menuOpen()) {

                <div

                  class="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface py-1 shadow-xl"

                >

                  <a

                    [routerLink]="['/profile', auth.currentUser()?.username]"

                    class="flex items-center gap-2 px-4 py-2 text-sm hover:bg-elevated"

                    (click)="menuOpen.set(false)"

                  >

                    <svg lucideUser [size]="16" />

                    {{ 'nav.profile' | translate }}

                  </a>

                  <a

                    routerLink="/settings"

                    class="flex items-center gap-2 px-4 py-2 text-sm hover:bg-elevated"

                    (click)="menuOpen.set(false)"

                  >

                    <svg lucideSettings [size]="16" />

                    {{ 'nav.settings' | translate }}

                  </a>

                  <button

                    type="button"

                    class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-elevated"

                    (click)="logout()"

                  >

                    <svg lucideLogOut [size]="16" />

                    {{ 'nav.logOut' | translate }}

                  </button>

                </div>

              }

            </div>

          } @else {

            <a routerLink="/auth/login" class="btn-secondary text-sm">{{ 'nav.logIn' | translate }}</a>

            <a routerLink="/auth/register" class="btn-primary text-sm hidden sm:inline-flex">{{

              'nav.signUp' | translate

            }}</a>

          }

        </div>

      </div>

    </header>

  `
})

export class NavbarComponent {

  readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  private readonly notificationService = inject(NotificationService);



  searchQuery = '';

  menuOpen = signal(false);

  unreadCount = signal(0);



  ngOnInit(): void {

    if (this.auth.isLoggedIn()) {

      this.notificationService.getUnreadCount().subscribe((count) => {

        this.unreadCount.set(count);

      });

    }

  }



  onSearch(event: Event): void {

    event.preventDefault();

    if (this.searchQuery.trim()) {

      this.router.navigate(['/explore'], {

        queryParams: { q: this.searchQuery.trim() },

      });

    }

  }



  logout(): void {

    this.auth.logout();

    this.menuOpen.set(false);

    this.router.navigate(['/auth/login']);

  }

}

