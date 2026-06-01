import { Component, input } from '@angular/core';

import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';



@Component({
    selector: 'app-movie-card',
    imports: [RouterLink, TranslatePipe],
    template: `

    <a

      [routerLink]="['/movies', movieId()]"

      class="group block overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-lg"

    >

      <div class="aspect-[2/3] overflow-hidden bg-elevated">

        @if (posterUrl()) {

          <img

            [src]="posterUrl()"

            [alt]="title()"

            class="h-full w-full object-cover transition group-hover:scale-105"

          />

        } @else {

          <div class="flex h-full items-center justify-center text-muted text-sm">

            {{ 'common.noPoster' | translate }}

          </div>

        }

      </div>

      <div class="p-3">

        <h3 class="truncate text-sm font-medium">{{ title() }}</h3>

        @if (year()) {

          <p class="text-xs text-muted">{{ year() }}</p>

        }

      </div>

    </a>

  `
})

export class MovieCardComponent {

  movieId = input.required<number>();

  title = input.required<string>();

  year = input<string>();

  posterUrl = input<string>();

}

