import { Component, inject } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import {

  LucideBell,

  LucideCompass,

  LucideHouse,

  LucideList,

  LucideUser,

} from '@lucide/angular';

import { AuthService } from '../../../core/services/auth.service';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';



interface NavItem {

  labelKey: string;

  route: string;

  icon: 'home' | 'compass' | 'list' | 'bell' | 'user';

  exact?: boolean;

  dynamicRoute?: boolean;

}



@Component({

  selector: 'app-bottom-nav',

  standalone: true,

  imports: [

    RouterLink,

    RouterLinkActive,

    TranslatePipe,

    LucideHouse,

    LucideCompass,

    LucideList,

    LucideBell,

    LucideUser,

  ],

  template: `

    <nav

      class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"

    >

      <div class="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">

        @for (item of navItems; track item.labelKey) {

          <a

            [routerLink]="item.dynamicRoute ? profileRoute : item.route"

            routerLinkActive="bottom-nav-active"

            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"

            class="bottom-nav-item"

          >

            @switch (item.icon) {

              @case ('home') { <svg lucideHome [size]="20" /> }

              @case ('compass') { <svg lucideCompass [size]="20" /> }

              @case ('list') { <svg lucideList [size]="20" /> }

              @case ('bell') { <svg lucideBell [size]="20" /> }

              @case ('user') { <svg lucideUser [size]="20" /> }

            }

            {{ item.labelKey | translate }}

          </a>

        }

      </div>

    </nav>

  `,

})

export class BottomNavComponent {

  private readonly auth = inject(AuthService);



  readonly navItems: NavItem[] = [

    { labelKey: 'nav.home', route: '/', icon: 'home', exact: true },

    { labelKey: 'nav.explore', route: '/explore', icon: 'compass' },

    { labelKey: 'nav.lists', route: '/lists', icon: 'list' },

    { labelKey: 'nav.alerts', route: '/notifications', icon: 'bell' },

    { labelKey: 'nav.profile', route: '/auth/login', icon: 'user', dynamicRoute: true },

  ];



  get profileRoute(): string {

    const username = this.auth.currentUser()?.username;

    return username ? `/profile/${username}` : '/auth/login';

  }

}

