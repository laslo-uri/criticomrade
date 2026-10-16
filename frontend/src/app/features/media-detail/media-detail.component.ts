import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { DecimalPipe } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import {
  LucideArrowLeft,
  LucideBookmark,
  LucideExternalLink,
  LucideHeart,
  LucideLibrary,
  LucidePenLine,
  LucideSwords,
  LucideCheck,
} from '@lucide/angular';
import { MovieService } from '../../core/services/movie.service';
import { MediaCredits, MediaService } from '../../core/services/media.service';
import { ReviewService } from '../../core/services/review.service';
import { ListService } from '../../core/services/list.service';
import { ReactionService } from '../../core/services/reaction.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { UiService } from '../../core/services/ui.service';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { MovieList } from '../../core/models/list.model';
import { Review } from '../../core/models/review.model';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MEDIA_TYPE_KEYS } from '../../core/utils/media-link';
import { errorMessage } from '../../core/utils/http-error';

type SortMode = 'recent' | 'liked';

@Component({
  selector: 'app-media-detail',
  imports: [
    DecimalPipe,
    RouterLink,
    TranslatePipe,
    LucidePenLine,
    LucideHeart,
    LucideExternalLink,
    LucideBookmark,
    LucideLibrary,
    LucideSwords,
    LucideArrowLeft,
    LucideCheck,
    ReviewCardComponent,
    EmptyStateComponent,
    PosterComponent,
    StarRatingComponent,
    ModalComponent,
  ],
  template: `
    @if (item(); as media) {
      <article>
        <div class="grid gap-7 sm:grid-cols-[11rem_minmax(0,1fr)] md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10">
          <div class="mx-auto w-40 sm:mx-0 sm:w-auto">
            <app-poster
              class="aspect-[2/3] overflow-hidden rounded-poster shadow-lift ring-1 ring-inset ring-text/10"
              [title]="media.title"
              [src]="media.posterApiLink"
              [mediaType]="media.mediaType"
              [year]="media.year"
              [creator]="media.creator"
              [eager]="true"
            />
          </div>

          <div class="min-w-0">
            <p class="text-sm font-semibold text-accent-ink">
              {{ typeKey(media.mediaType) | translate }}@if (media.year) {<span class="text-muted">, {{ media.year }}</span>}
            </p>
            <h1 class="mt-1 font-display text-[clamp(2.6rem,6vw,4.4rem)] font-extrabold uppercase leading-[0.86] tracking-[0.005em]">{{ media.title }}</h1>
            @if (media.creator) {
              <p class="mt-3 text-[17px] text-text/90">{{ creatorPrefix(media.mediaType) | translate }} <span class="font-semibold">{{ media.creator }}</span></p>
            }
            <div class="mt-3 flex flex-wrap gap-1.5">
              @for (g of genres(); track g) {
                <a routerLink="/explore" [queryParams]="{ type: media.mediaType ?? 'FILM', genre: g }" class="tag bg-elevated text-[12px] text-text/90 hover:bg-border">{{ g }}</a>
              }
              @if (media.network) { <span class="tag border border-border text-[12px] text-muted">{{ media.network }}</span> }
              @if (media.seasonCount) { <span class="tag border border-border text-[12px] text-muted">{{ 'movie.seasons' | translate: { count: media.seasonCount } }}</span> }
              @if (media.pageCount) { <span class="tag border border-border text-[12px] text-muted">{{ 'movie.pages' | translate: { count: media.pageCount } }}</span> }
              @if (media.trackCount) { <span class="tag border border-border text-[12px] text-muted">{{ 'movie.trackCount' | translate: { count: media.trackCount } }}</span> }
            </div>

            @if (media.description) {
              <p class="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-text/90">{{ media.description }}</p>
            }

            <div class="mt-6 flex flex-wrap gap-2">
              @if (auth.isLoggedIn()) {
                <button type="button" class="btn-primary" (click)="ui.openReview(media)">
                  <svg lucidePenLine [size]="17" /> {{ (myReview() ? 'movie.logAgain' : 'movie.writeReview') | translate }}
                </button>
                @if (lists.canAdd(media)) {
                  <button type="button" class="btn-secondary" [attr.aria-pressed]="inWatchlist()" (click)="toggleWatchlist()" [disabled]="busy()">
                    @if (inWatchlist()) { <svg lucideCheck [size]="17" class="text-success" /> } @else { <svg lucideBookmark [size]="17" /> }
                    {{ (inWatchlist() ? 'movie.inWatchlist' : 'movie.addToWatchlist') | translate }}
                  </button>
                  <button type="button" class="btn-secondary" (click)="openListPicker()">
                    <svg lucideLibrary [size]="17" /> {{ 'movie.addToList' | translate }}
                  </button>
                }
                @if (media.id) {
                  <button type="button" class="btn-secondary" [class.text-accent-ink]="liked()" [attr.aria-pressed]="liked()" (click)="toggleLike()">
                    <svg lucideHeart [size]="17" [class.fill-current]="liked()" /> <span class="sr-only">{{ 'movie.like' | translate }}</span> <span class="tabular-nums">{{ likeCount() }}</span>
                  </button>
                }
                <a routerLink="/recommendations" [queryParams]="challengeQuery()" class="btn-ghost">
                  <svg lucideSwords [size]="17" /> {{ 'movie.challenge' | translate }}
                </a>
              } @else {
                <a routerLink="/auth/login" [queryParams]="{ returnUrl: currentUrl() }" class="btn-primary">{{ 'movie.signInToLog' | translate }}</a>
              }
            </div>

            @if (media.imdbLink || media.letterboxdLink || media.youtubeTrailerLink) {
              <div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                @if (media.youtubeTrailerLink) {
                  <a [href]="media.youtubeTrailerLink" target="_blank" rel="noopener noreferrer" class="link-quiet inline-flex items-center gap-1.5"><svg lucideExternalLink [size]="14" /> {{ 'movie.trailer' | translate }}</a>
                }
                @if (media.imdbLink) {
                  <a [href]="media.imdbLink" target="_blank" rel="noopener noreferrer" class="link-quiet inline-flex items-center gap-1.5"><svg lucideExternalLink [size]="14" /> IMDb</a>
                }
                @if (media.letterboxdLink) {
                  <a [href]="media.letterboxdLink" target="_blank" rel="noopener noreferrer" class="link-quiet inline-flex items-center gap-1.5"><svg lucideExternalLink [size]="14" /> Letterboxd</a>
                }
              </div>
            }
          </div>
        </div>

        <!-- Community verdict -->
        <section class="mt-12 grid gap-6 border-y border-border/70 py-7 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10">
          <div>
            <p class="text-sm font-semibold text-muted">{{ 'movie.community' | translate }}</p>
            @if (stats().count) {
              <p class="mt-1 flex items-baseline gap-2">
                <span class="font-display text-6xl font-extrabold leading-none tabular-nums">{{ stats().average | number: '1.1-1' }}</span>
                <span class="text-muted">/ 5</span>
              </p>
              <app-star-rating class="mt-2" [value]="stats().roundedAverage" [size]="16" />
              <p class="mt-1 text-sm text-muted">{{ 'movie.ratingCount' | translate: { count: stats().count } }}</p>
            } @else {
              <p class="mt-1 font-display text-3xl font-bold uppercase leading-none">{{ 'movie.notRatedYet' | translate }}</p>
            }
            @if (media.imdbRating && !runtimeDemoScore()) {
              <p class="mt-2 text-sm text-muted">IMDb {{ media.imdbRating | number: '1.1-1' }}@if (media.rottenTomatoesRating) {, Rotten Tomatoes {{ media.rottenTomatoesRating }}%}</p>
            }
          </div>
          @if (stats().count) {
            <ul class="max-w-md space-y-1.5" [attr.aria-label]="'stats.distribution' | translate">
              @for (bucket of stats().buckets; track bucket.stars) {
                <li class="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3 text-[13px]">
                  <span class="tabular-nums text-muted">{{ bucket.stars }} ★</span>
                  <span class="h-2 overflow-hidden rounded-sm bg-elevated">
                    <span class="block h-full rounded-sm bg-brass" [style.width.%]="bucket.width"></span>
                  </span>
                  <span class="text-right tabular-nums text-muted">{{ bucket.count }}</span>
                </li>
              }
            </ul>
          }
        </section>

        @if (credits().cast.length) {
          <section class="mt-10">
            <h2 class="section-title mb-4">{{ 'movie.cast' | translate }}</h2>
            <ul class="flex flex-wrap gap-2">
              @for (name of credits().cast; track name) {
                <li class="rounded-full border border-border px-3.5 py-1.5 text-sm">{{ name }}</li>
              }
            </ul>
          </section>
        }
        @if (credits().tracks.length) {
          <section class="mt-10">
            <h2 class="section-title mb-4">{{ 'movie.tracks' | translate }}</h2>
            <ol class="grid gap-x-8 sm:grid-cols-2">
              @for (track of credits().tracks; track $index) {
                <li class="flex gap-3 border-b border-border/60 py-2 text-[15px]">
                  <span class="w-6 shrink-0 text-right tabular-nums text-muted">{{ $index + 1 }}</span>{{ track }}
                </li>
              }
            </ol>
          </section>
        }

        <section class="mt-12" aria-labelledby="reviews-title">
          <div class="section-heading">
            <h2 id="reviews-title" class="section-title">{{ 'movie.reviewsTitle' | translate }}</h2>
            @if (reviews().length > 1) {
              <div class="flex gap-1" role="group" [attr.aria-label]="'movie.sort' | translate">
                <button type="button" class="chip !min-h-8" [class.chip-active]="sort() === 'recent'" (click)="sort.set('recent')">{{ 'movie.sortRecent' | translate }}</button>
                <button type="button" class="chip !min-h-8" [class.chip-active]="sort() === 'liked'" (click)="sort.set('liked')">{{ 'movie.sortLiked' | translate }}</button>
              </div>
            }
          </div>
          @if (sortedReviews().length === 0) {
            <app-empty-state [message]="'movie.reviewsEmptyMessage' | translate" [hint]="'movie.reviewsEmptyHint' | translate">
              <svg emptyIcon lucidePenLine [size]="26" />
              @if (auth.isLoggedIn()) {
                <button type="button" class="btn-primary" (click)="ui.openReview(media)">{{ 'movie.writeReview' | translate }}</button>
              }
            </app-empty-state>
          } @else {
            @for (review of sortedReviews(); track review.id) {
              <app-review-card [review]="review" [showMedia]="false" (deleted)="loadReviews()" (updated)="loadReviews()" />
            }
          }
        </section>
      </article>

      <app-modal [open]="listPickerOpen()" [title]="'movie.addToList' | translate" panelClass="sm:max-w-md" (closed)="listPickerOpen.set(false)">
        @if (myLists().length === 0) {
          <p class="text-sm text-muted">{{ 'movie.noLists' | translate }}</p>
          <a routerLink="/lists" class="btn-primary btn-sm mt-4" (click)="listPickerOpen.set(false)">{{ 'lists.newList' | translate }}</a>
        } @else {
          <ul class="-mx-2">
            @for (list of myLists(); track list.id) {
              <li>
                <button type="button" class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-elevated" (click)="addToList(list)" [disabled]="inList(list)">
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-semibold">{{ list.name }}</span>
                    <span class="block text-sm text-muted">{{ 'lists.itemCount' | translate: { count: list.numberOfElements ?? list.movies?.length ?? 0 } }}</span>
                  </span>
                  @if (inList(list)) { <svg lucideCheck [size]="18" class="text-success" /> }
                </button>
              </li>
            }
          </ul>
        }
      </app-modal>
    } @else if (loading()) {
      <div class="grid gap-8 sm:grid-cols-[11rem_minmax(0,1fr)] md:grid-cols-[13.5rem_minmax(0,1fr)]" aria-busy="true">
        <div class="skeleton mx-auto aspect-[2/3] w-40 rounded-poster sm:w-auto"></div>
        <div class="space-y-3">
          <div class="skeleton h-4 w-24"></div>
          <div class="skeleton h-14 w-3/4"></div>
          <div class="skeleton h-4 w-1/3"></div>
          <div class="skeleton mt-6 h-20 w-full"></div>
        </div>
      </div>
    } @else {
      <app-empty-state [message]="(notFound() ? 'movie.notFound' : 'common.loadFailed') | translate" [hint]="'movie.notFoundHint' | translate" [pageHeading]="true">
        <svg emptyIcon lucideArrowLeft [size]="26" />
        <a routerLink="/explore" class="btn-primary">{{ 'nav.explore' | translate }}</a>
      </app-empty-state>
    }
  `,
})
export class MediaDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly movieService = inject(MovieService);
  private readonly mediaService = inject(MediaService);
  private readonly reviewService = inject(ReviewService);
  readonly lists = inject(ListService);
  private readonly reactionService = inject(ReactionService);
  readonly auth = inject(AuthService);
  readonly ui = inject(UiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly item = signal<MediaItem | null>(null);
  readonly credits = signal<MediaCredits>({ cast: [], tracks: [] });
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly likeCount = signal(0);
  readonly liked = signal(false);
  readonly watchlist = signal<MovieList | null>(null);
  readonly myLists = signal<MovieList[]>([]);
  readonly listPickerOpen = signal(false);
  readonly busy = signal(false);
  readonly sort = signal<SortMode>('recent');

  readonly genres = computed(() =>
    (this.item()?.genre ?? '').split(',').map((g) => g.trim()).filter(Boolean)
  );
  readonly myReview = computed(() =>
    this.reviews().find((r) => r.user?.username === this.auth.currentUser()?.username)
  );
  readonly inWatchlist = computed(() => {
    const media = this.item();
    return !!media && !!this.watchlist()?.movies?.some((m) => this.same(m, media));
  });
  readonly sortedReviews = computed(() => {
    const list = [...this.reviews()];
    if (this.sort() === 'liked') list.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    return list;
  });
  readonly stats = computed(() => {
    const rated = this.reviews().filter((r) => r.rating);
    const count = rated.length;
    const average = count ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / count : 0;
    const counts = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: rated.filter((r) => Math.ceil(r.rating ?? 0) === stars).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return {
      count,
      average,
      roundedAverage: Math.round(average * 2) / 2,
      buckets: counts.map((c) => ({ ...c, width: Math.round((c.count / max) * 100) })),
    };
  });

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadFromRoute());
    this.ui.reviewPublished$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadReviews();
      this.loadWatchlist();
    });
  }

  typeKey(type?: MediaType): string {
    return MEDIA_TYPE_KEYS[type ?? 'FILM'];
  }

  creatorPrefix(type?: MediaType): string {
    return { FILM: 'movie.directedBy', SHOW: 'movie.createdBy', EPISODE: 'movie.createdBy', BOOK: 'movie.writtenBy', ALBUM: 'movie.by' }[type ?? 'FILM'];
  }

  /** The detail page is the same score in the demo, so don't repeat it as "IMDb". */
  runtimeDemoScore(): boolean {
    return this.item()?.externalKey?.startsWith('demo:') ?? false;
  }

  currentUrl(): string {
    return this.router.url;
  }

  challengeQuery(): Record<string, string> {
    const m = this.item();
    if (!m) return {};
    return {
      title: m.title,
      ...(m.tmdbId ? { tmdbId: String(m.tmdbId) } : {}),
      ...(m.externalKey ? { key: m.externalKey } : {}),
      type: m.mediaType ?? 'FILM',
    };
  }

  loadReviews(): void {
    const media = this.item();
    if (!media?.id) {
      this.reviews.set([]);
      return;
    }
    this.reviewService.getByMovie(media.id, 0, 50).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => this.reviews.set([]),
    });
  }

  toggleWatchlist(): void {
    const media = this.item();
    const list = this.watchlist();
    if (!media || !list || this.busy()) return;
    this.busy.set(true);
    const existing = list.movies?.find((m) => this.same(m, media));
    const request: Observable<unknown> = existing?.id
      ? this.lists.removeMovie(list.id, existing.id)
      : this.lists.addMedia(list.id, media);
    request.subscribe({
      next: () => {
        this.toast.success(this.i18n.translate(existing ? 'movie.removedFromWatchlist' : 'movie.addedToWatchlist'));
        this.loadWatchlist();
        this.busy.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, this.i18n.translate('movie.couldNotAddToWatchlist')));
        this.busy.set(false);
      },
    });
  }

  openListPicker(): void {
    this.listPickerOpen.set(true);
    this.lists.getMyLists('CUSTOM').subscribe({
      next: (lists) => this.myLists.set(lists),
      error: () => this.myLists.set([]),
    });
  }

  inList(list: MovieList): boolean {
    const media = this.item();
    return !!media && !!list.movies?.some((m) => this.same(m, media));
  }

  addToList(list: MovieList): void {
    const media = this.item();
    if (!media) return;
    this.lists.addMedia(list.id, media).subscribe({
      next: (updated) => {
        this.myLists.update((all) => all.map((l) => (l.id === updated.id ? updated : l)));
        this.toast.success(this.i18n.translate('movie.addedToList', { list: list.name }));
        this.listPickerOpen.set(false);
      },
      error: (err) => this.toast.error(errorMessage(err, this.i18n.translate('listDetail.couldNotAddMovie'))),
    });
  }

  toggleLike(): void {
    const media = this.item();
    if (!media?.id) return;
    const was = this.liked();
    this.liked.set(!was);
    this.likeCount.update((n) => n + (was ? -1 : 1));
    this.reactionService.toggle('movie', media.id).subscribe({
      next: (reactions) => {
        this.likeCount.set(this.reactionService.getLikeCount(reactions));
        this.liked.set(this.reactionService.isLikedByCurrentUser(reactions));
      },
      error: () => {
        this.liked.set(was);
        this.likeCount.update((n) => n + (was ? 1 : -1));
      },
    });
  }

  private same(a: MediaItem, b: MediaItem): boolean {
    return (!!a.id && a.id === b.id) || (!!a.tmdbId && a.tmdbId === b.tmdbId) || (!!a.externalKey && a.externalKey === b.externalKey);
  }

  private loadFromRoute(): void {
    const params = this.route.snapshot.paramMap;
    const query = this.route.snapshot.queryParamMap;
    const tmdbId = params.get('tmdbId');
    const id = params.get('id');
    const key = query.get('key');
    const type = (query.get('type') ?? 'FILM') as MediaType;

    let request: Observable<MediaItem> | null = null;
    if (tmdbId) request = this.movieService.getMovieByTmdbId(Number(tmdbId));
    else if (key) request = this.mediaService.resolve(type, key);
    else if (id && !isNaN(Number(id))) request = this.movieService.getMovieById(Number(id));

    this.item.set(null);
    this.reviews.set([]);
    this.credits.set({ cast: [], tracks: [] });
    this.notFound.set(false);
    if (!request) {
      this.loading.set(false);
      this.notFound.set(true);
      this.title.setTitle(`${this.i18n.translate('movie.notFound')} · CritiComrade`);
      return;
    }
    this.loading.set(true);
    request.subscribe({
      next: (media) => this.finish(media),
      error: (err) => {
        this.loading.set(false);
        this.notFound.set(err?.status === 404 || err?.status === 400);
        this.title.setTitle(`${this.i18n.translate(this.notFound() ? 'movie.notFound' : 'common.loadFailed')} · CritiComrade`);
      },
    });
  }

  private finish(media: MediaItem): void {
    this.item.set(media);
    this.loading.set(false);
    this.title.setTitle(`${media.title}${media.year ? ` (${media.year})` : ''} · CritiComrade`);
    this.loadReviews();
    this.loadCredits(media);
    this.loadWatchlist();
    if (media.id) {
      this.reactionService.getMovieReactions(media.id).subscribe({
        next: (reactions) => {
          this.likeCount.set(this.reactionService.getLikeCount(reactions));
          this.liked.set(this.reactionService.isLikedByCurrentUser(reactions));
        },
        error: () => undefined,
      });
    }
  }

  private loadWatchlist(): void {
    if (!this.auth.isLoggedIn()) return;
    this.lists.getWatchlist().subscribe({
      next: (list) => this.watchlist.set(list),
      error: () => this.watchlist.set(null),
    });
  }

  private loadCredits(media: MediaItem): void {
    const type = media.mediaType ?? 'FILM';
    const key =
      type === 'FILM' && media.tmdbId && !media.externalKey?.startsWith('demo:')
        ? String(media.tmdbId)
        : media.externalKey?.startsWith('sp:') || media.externalKey?.startsWith('demo:')
          ? media.externalKey
          : media.externalKey?.replace(/^(tv:|ol:|mb:|tmdb:)/, '');
    if (!key || type === 'BOOK' || type === 'EPISODE') return;
    this.mediaService.credits(type, key).subscribe({
      next: (credits) => this.credits.set({ cast: credits?.cast ?? [], tracks: credits?.tracks ?? [] }),
      error: () => undefined,
    });
  }
}
