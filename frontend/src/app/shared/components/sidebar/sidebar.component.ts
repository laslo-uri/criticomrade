import { Component } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import {

  LucideBell,

  LucideBookOpen,

  LucideBookmark,

  LucideCompass,

  LucideGift,

  LucideHouse,

  LucideList,

  LucideSettings,

} from '@lucide/angular';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';



interface NavItem {

  labelKey: string;

  route: string;

  icon: 'home' | 'compass' | 'book' | 'bookmark' | 'list' | 'gift' | 'bell' | 'settings';

  exact?: boolean;

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
        LucideList,
        LucideGift,
        LucideBell,
        LucideSettings,
    ],
    template: `

    <aside class="hidden h-full flex-col border-r border-border bg-surface/50 md:flex">

      <nav class="flex flex-1 flex-col gap-0.5 p-3">

        <p class="mb-2 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted/70">

          {{ 'nav.menu' | translate }}

        </p>

        @for (item of mainNavItems; track item.route) {

          <a

            [routerLink]="item.route"

            routerLinkActive="nav-link-active"

            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"

            class="nav-link"

          >

            @switch (item.icon) {

              @case ('home') { <svg lucideHome [size]="18" /> }

              @case ('compass') { <svg lucideCompass [size]="18" /> }

              @case ('book') { <svg lucideBookOpen [size]="18" /> }

              @case ('bookmark') { <svg lucideBookmark [size]="18" /> }

              @case ('list') { <svg lucideList [size]="18" /> }

              @case ('gift') { <svg lucideGift [size]="18" /> }

            }

            {{ item.labelKey | translate }}

          </a>

        }



        <p class="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/70">

          {{ 'nav.account' | translate }}

        </p>

        @for (item of accountNavItems; track item.route) {

          <a

            [routerLink]="item.route"

            routerLinkActive="nav-link-active"

            class="nav-link"

          >

            @switch (item.icon) {

              @case ('bell') { <svg lucideBell [size]="18" /> }

              @case ('settings') { <svg lucideSettings [size]="18" /> }

            }

            {{ item.labelKey | translate }}

          </a>

        }

      </nav>

    </aside>

  `
})

export class SidebarComponent {

  readonly mainNavItems: NavItem[] = [

    { labelKey: 'nav.home', route: '/', icon: 'home', exact: true },

    { labelKey: 'nav.explore', route: '/explore', icon: 'compass' },

    { labelKey: 'nav.diary', route: '/diary', icon: 'book' },

    { labelKey: 'nav.watchlist', route: '/watchlist', icon: 'bookmark' },

    { labelKey: 'nav.lists', route: '/lists', icon: 'list' },

    { labelKey: 'nav.recommendations', route: '/recommendations', icon: 'gift' },

  ];



  readonly accountNavItems: NavItem[] = [

    { labelKey: 'nav.notifications', route: '/notifications', icon: 'bell' },

    { labelKey: 'nav.settings', route: '/settings', icon: 'settings' },

  ];

}

