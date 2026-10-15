import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="py-16 text-center sm:py-24">
      <p class="font-display text-[clamp(6rem,22vw,12rem)] font-extrabold leading-none text-accent">404</p>
      <h1 class="mt-2 font-display text-4xl font-extrabold uppercase leading-none">{{ 'notFound.title' | translate }}</h1>
      <p class="mx-auto mt-3 max-w-sm text-muted">{{ 'notFound.text' | translate }}</p>
      <div class="mt-7 flex justify-center gap-2">
        <a routerLink="/" class="btn-primary">{{ 'notFound.home' | translate }}</a>
        <a routerLink="/explore" class="btn-secondary">{{ 'nav.explore' | translate }}</a>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
