import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { DemoBannerComponent } from '../../shared/components/demo-banner/demo-banner.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { ThemeService } from '../../core/services/theme.service';

/** Split screen: a poster wall on wide screens, the form on the right. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, LogoComponent, ToastComponent, DemoBannerComponent, PosterComponent, TranslatePipe],
  template: `
    <app-demo-banner />
    <div class="grid min-h-[calc(100dvh-2rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside class="relative hidden overflow-hidden bg-ink lg:block" aria-hidden="true">
        <div class="rays absolute -left-1/2 -top-1/4 h-[150%] w-[150%] animate-rays-in opacity-90"></div>
        <div class="absolute inset-x-12 bottom-12 top-24 flex flex-col justify-between">
          <div class="relative h-[62%]">
            @for (p of posters; track p.title) {
              <app-poster
                class="absolute aspect-[2/3] w-[38%] overflow-hidden rounded-[4px] shadow-lift animate-stamp-in"
                [style.left.%]="p.left"
                [style.top.%]="p.top"
                [style.--tilt]="p.tilt + 'deg'"
                [style.animation-delay.ms]="p.delay"
                [title]="p.title"
                [mediaType]="p.type"
                [year]="p.year"
                [creator]="p.creator"
                [eager]="true"
              />
            }
          </div>
          <p class="max-w-md font-display text-[3.4rem] font-extrabold uppercase leading-[0.88] text-paper">
            {{ 'auth.side.headline' | translate }}
          </p>
        </div>
      </aside>
      <main class="flex flex-col px-5 py-8 sm:px-10">
        <div class="flex items-center justify-between">
          <app-logo variant="nav" />
          <a routerLink="/explore" class="btn-ghost btn-sm">{{ 'auth.side.browse' | translate }}</a>
        </div>
        <div class="mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center py-10">
          <router-outlet />
        </div>
      </main>
    </div>
    <app-toast />
  `,
})
export class AuthLayoutComponent {
  // Instantiated so the theme is applied on direct visits.
  private readonly theme = inject(ThemeService);

  readonly posters = [
    { title: 'Stalker', type: 'FILM' as const, year: '1979', creator: 'Andrei Tarkovsky', left: 2, top: 10, tilt: -7, delay: 100 },
    { title: 'The Dispossessed', type: 'BOOK' as const, year: '1974', creator: 'Ursula K. Le Guin', left: 32, top: 0, tilt: 3, delay: 220 },
    { title: 'Kid A', type: 'ALBUM' as const, year: '2000', creator: 'Radiohead', left: 61, top: 14, tilt: 8, delay: 340 },
  ];
}
