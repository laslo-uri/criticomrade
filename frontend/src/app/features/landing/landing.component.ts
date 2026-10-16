import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { LucideBookOpen, LucideSwords, LucideUsers } from '@lucide/angular';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { DemoBannerComponent } from '../../shared/components/demo-banner/demo-banner.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { MediaService } from '../../core/services/media.service';
import { RuntimeService } from '../../core/services/runtime.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { DEMO_PASSWORD, DEMO_USERNAME } from '../../core/demo/demo-seed';

@Component({
  selector: 'app-landing',
  imports: [
    RouterLink,
    LogoComponent,
    PosterComponent,
    StarRatingComponent,
    MediaCardComponent,
    AvatarComponent,
    DemoBannerComponent,
    FooterComponent,
    ToastComponent,
    TranslatePipe,
    LucideBookOpen,
    LucideUsers,
    LucideSwords,
  ],
  template: `
    <app-demo-banner />

    <!-- Hero: the one loud moment. Always dark, like a poster on a wall. -->
    <section class="relative isolate overflow-hidden bg-bg text-text" data-theme="dark" aria-labelledby="landing-title">
      <div class="rays pointer-events-none absolute -right-[40%] -top-[30%] -z-10 h-[160%] w-[120%] animate-rays-in sm:-right-[25%]" aria-hidden="true"></div>

      <header class="relative mx-auto flex h-16 max-w-page items-center gap-3 px-4 lg:px-6">
        <app-logo variant="nav" />
        <nav class="ml-auto flex items-center gap-1">
          <a routerLink="/explore" class="btn-ghost btn-sm hidden sm:inline-flex">{{ 'nav.explore' | translate }}</a>
          <a routerLink="/auth/login" class="btn-ghost btn-sm">{{ 'nav.logIn' | translate }}</a>
          <a routerLink="/auth/register" class="btn-primary btn-sm hidden sm:inline-flex">{{ 'nav.signUp' | translate }}</a>
        </nav>
      </header>

      <div class="mx-auto grid max-w-page items-center gap-12 px-4 pb-20 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-6 lg:pb-28">
        <div>
          <h1 id="landing-title" class="break-words font-display font-extrabold uppercase leading-[0.9] tracking-[0.004em] text-[clamp(3.4rem,10.5vw,7.4rem)]">
            <span class="block animate-fade-up">{{ 'landing.line1' | translate }}</span>
            <span class="block animate-fade-up [animation-delay:90ms]">{{ 'landing.line2' | translate }}</span>
            <span class="block animate-fade-up [animation-delay:180ms]">{{ 'landing.line3' | translate }}</span>
          </h1>
          <p class="mt-7 max-w-[34rem] text-[17px] leading-relaxed text-text/80">{{ 'landing.lede' | translate }}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            @if (runtime.anyDemo()) {
              <button type="button" class="btn-brass !min-h-12 !px-7 text-[15px]" (click)="tryDemo()" [disabled]="entering()">
                {{ (entering() ? 'landing.entering' : 'landing.tryDemo') | translate }}
              </button>
            }
            <a routerLink="/auth/register" class="btn-secondary !min-h-12 !bg-transparent !px-7 text-[15px]">
              {{ 'landing.createAccount' | translate }}
            </a>
          </div>
          @if (runtime.anyDemo()) {
            <p class="mt-4 text-[13px] text-muted">{{ (runtime.demo() ? 'landing.demoNote' : 'landing.demoNoteServer') | translate }}</p>
          }
        </div>

        <!-- Stamped posters with a review pinned over them -->
        <div class="relative mx-auto aspect-[5/4] w-full max-w-[34rem]" aria-hidden="true">
          @for (p of heroPosters; track p.title) {
            <app-poster
              class="absolute aspect-[2/3] w-[42%] overflow-hidden rounded-[5px] shadow-lift animate-stamp-in"
              [style.left.%]="p.left"
              [style.top.%]="p.top"
              [style.--tilt]="p.tilt + 'deg'"
              [style.animation-delay.ms]="p.delay"
              [style.z-index]="p.z"
              [title]="p.title"
              [mediaType]="p.type"
              [year]="p.year"
              [creator]="p.creator"
              [eager]="true"
            />
          }
          <figure class="absolute -bottom-6 left-[4%] z-10 w-[78%] max-w-[22rem] rotate-[-2deg] animate-stamp-in rounded-panel bg-paper p-4 text-ink shadow-lift [--tilt:-2deg] [animation-delay:620ms] sm:left-[10%]">
            <div class="flex items-center gap-2.5">
              <app-avatar name="vera" [size]="32" />
              <div class="min-w-0 text-[13px] leading-tight">
                <p class="font-bold">vera</p>
                <p class="text-ink/65">{{ 'landing.onTitle' | translate: { title: 'Portrait of a Lady on Fire' } }}</p>
              </div>
              <app-star-rating class="ml-auto" [value]="4.5" [size]="14" />
            </div>
            <blockquote class="mt-2.5 font-display text-[1.65rem] font-bold uppercase leading-[0.95]">{{ 'landing.quote' | translate }}</blockquote>
          </figure>
        </div>
      </div>
    </section>

    <main>
      <!-- The four things you can log, set as type -->
      <section class="border-b border-border/70" [attr.aria-label]="'landing.typesLabel' | translate">
        <div class="mx-auto grid max-w-page grid-cols-2 gap-px bg-border/70 sm:grid-cols-4">
          @for (t of types; track t.type) {
            <a routerLink="/explore" [queryParams]="{ type: t.type }" class="group bg-bg py-7 sm:py-9 lg:px-2">
              <span class="block px-4 font-display text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold uppercase leading-none text-text transition group-hover:text-accent-ink">{{ t.labelKey | translate }}</span>
              <span class="mt-1 block px-4 text-sm text-muted">{{ t.hintKey | translate }}</span>
            </a>
          }
        </div>
      </section>

      <!-- What you do here -->
      <section class="mx-auto max-w-page px-4 py-20 lg:px-6">
        <h2 class="max-w-2xl font-display text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold uppercase leading-[0.9]">{{ 'landing.howTitle' | translate }}</h2>
        <div class="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          <article>
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-paper"><svg lucideBookOpen [size]="22" /></span>
            <h3 class="mt-5 text-lg font-bold">{{ 'landing.diaryTitle' | translate }}</h3>
            <p class="mt-2 leading-relaxed text-muted">{{ 'landing.diaryText' | translate }}</p>
          </article>
          <article>
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-brass text-ink"><svg lucideUsers [size]="22" /></span>
            <h3 class="mt-5 text-lg font-bold">{{ 'landing.comradesTitle' | translate }}</h3>
            <p class="mt-2 leading-relaxed text-muted">{{ 'landing.comradesText' | translate }}</p>
          </article>
          <article>
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-text text-bg"><svg lucideSwords [size]="22" /></span>
            <h3 class="mt-5 text-lg font-bold">{{ 'landing.challengesTitle' | translate }}</h3>
            <p class="mt-2 leading-relaxed text-muted">{{ 'landing.challengesText' | translate }}</p>
          </article>
        </div>
      </section>

      @if (popular().length) {
        <section class="mx-auto max-w-page px-4 pb-20 lg:px-6">
          <div class="section-heading">
            <h2 class="section-title">{{ 'landing.popularTitle' | translate }}</h2>
            <a routerLink="/explore" class="link-quiet text-sm">{{ 'home.seeAll' | translate }}</a>
          </div>
          <div class="chip-row gap-4 pb-2">
            @for (item of popular(); track item.externalKey ?? item.id ?? item.title) {
              <div class="w-[8.5rem] shrink-0 sm:w-[9.5rem]">
                <app-media-card [item]="item" />
              </div>
            }
          </div>
        </section>
      }

      <section class="bg-accent text-paper">
        <div class="mx-auto flex max-w-page flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p class="max-w-xl font-display text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold uppercase leading-[0.9]">{{ 'landing.ctaTitle' | translate }}</p>
          @if (runtime.anyDemo()) {
            <button type="button" class="btn !min-h-12 shrink-0 bg-paper !px-7 text-[15px] text-ink hover:bg-white" (click)="tryDemo()" [disabled]="entering()">{{ 'landing.tryDemo' | translate }}</button>
          } @else {
            <a routerLink="/auth/register" class="btn !min-h-12 shrink-0 bg-paper !px-7 text-[15px] text-ink hover:bg-white">{{ 'landing.createAccount' | translate }}</a>
          }
        </div>
      </section>
    </main>

    <div class="mx-auto max-w-page px-4 py-8 lg:px-6">
      <app-footer />
    </div>
    <app-toast />
  `,
})
export class LandingComponent implements OnInit {
  readonly runtime = inject(RuntimeService);
  private readonly auth = inject(AuthService);
  private readonly media = inject(MediaService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly theme = inject(ThemeService);

  readonly entering = signal(false);
  readonly popular = signal<MediaItem[]>([]);

  readonly heroPosters = [
    { title: 'Portrait of a Lady on Fire', type: 'FILM' as const, year: '2019', creator: 'Céline Sciamma', left: 2, top: 4, tilt: -8, delay: 150, z: 1 },
    { title: 'Satantango', type: 'BOOK' as const, year: '1985', creator: 'László Krasznahorkai', left: 29, top: 0, tilt: 2, delay: 280, z: 2 },
    { title: 'Remain in Light', type: 'ALBUM' as const, year: '1980', creator: 'Talking Heads', left: 56, top: 8, tilt: 9, delay: 410, z: 1 },
  ];

  readonly types: { type: MediaType; labelKey: string; hintKey: string }[] = [
    { type: 'FILM', labelKey: 'nav.films', hintKey: 'landing.filmsHint' },
    { type: 'SHOW', labelKey: 'nav.shows', hintKey: 'landing.showsHint' },
    { type: 'BOOK', labelKey: 'nav.books', hintKey: 'landing.booksHint' },
    { type: 'ALBUM', labelKey: 'nav.music', hintKey: 'landing.albumsHint' },
  ];

  ngOnInit(): void {
    const pick = (type: MediaType) => this.media.popular(type).pipe(catchError(() => of([] as MediaItem[])));
    forkJoin([pick('FILM'), pick('SHOW'), pick('BOOK'), pick('ALBUM')]).subscribe((groups) => {
      // Interleave the types so the rail shows the range.
      const mixed: MediaItem[] = [];
      for (let i = 0; i < 4; i++) for (const g of groups) if (g[i]) mixed.push(g[i]);
      this.popular.set(mixed);
    });
  }

  tryDemo(): void {
    this.entering.set(true);
    this.auth.login({ username: DEMO_USERNAME, password: DEMO_PASSWORD, rememberMe: true }).subscribe({
      next: () => this.router.navigateByUrl('/', { onSameUrlNavigation: 'reload' }),
      error: () => {
        this.entering.set(false);
        this.toast.error(this.i18n.translate('common.serverUnavailable'));
      },
    });
  }
}
