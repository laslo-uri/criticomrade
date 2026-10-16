import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { LucideArrowLeft, LucideLock, LucidePlus, LucideSearch, LucideTrash2, LucideX, LucideCheck } from '@lucide/angular';
import { ListService } from '../../core/services/list.service';
import { MediaService } from '../../core/services/media.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { RuntimeService } from '../../core/services/runtime.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { MovieList } from '../../core/models/list.model';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MEDIA_TYPE_KEYS } from '../../core/utils/media-link';
import { errorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-list-detail',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    LucideSearch,
    LucideX,
    LucideArrowLeft,
    LucideLock,
    LucidePlus,
    LucideTrash2,
    LucideCheck,
    MediaCardComponent,
    EmptyStateComponent,
    PosterComponent,
  ],
  template: `
    <a routerLink="/lists" class="btn-ghost btn-sm -ml-3 mb-4"><svg lucideArrowLeft [size]="16" /> {{ 'lists.title' | translate }}</a>

    @if (list(); as l) {
      <header class="page-header">
        <div class="min-w-0">
          <h1 class="page-title flex items-center gap-3">
            <span class="min-w-0 break-words">{{ l.name }}</span>
            @if (l.isPrivateList) { <svg lucideLock [size]="22" class="shrink-0 text-muted" [attr.aria-label]="'lists.privateBadge' | translate" /> }
          </h1>
          <p class="page-subtitle">{{ 'lists.itemCount' | translate: { count: l.movies?.length ?? 0 } }}</p>
        </div>
        @if (canDelete(l)) {
          @if (confirmDelete()) {
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ 'listDetail.confirmDelete' | translate }}</span>
              <button type="button" class="btn btn-sm !bg-danger/15 !text-danger" (click)="deleteList()">{{ 'common.delete' | translate }}</button>
              <button type="button" class="btn-ghost btn-sm" (click)="confirmDelete.set(false)">{{ 'common.cancel' | translate }}</button>
            </div>
          } @else {
            <button type="button" class="btn-ghost btn-sm" (click)="confirmDelete.set(true)"><svg lucideTrash2 [size]="15" /> {{ 'listDetail.delete' | translate }}</button>
          }
        }
      </header>

      <div class="relative max-w-xl">
        <label class="sr-only" for="list-add">{{ 'listDetail.searchPlaceholder' | translate }}</label>
        <svg lucideSearch [size]="17" class="pointer-events-none absolute left-3.5 top-[1.4rem] -translate-y-1/2 text-muted" />
        <input id="list-add" type="search" class="input-field pl-10" [placeholder]="'listDetail.searchPlaceholder' | translate" [ngModel]="query()" (ngModelChange)="onQuery($event)" autocomplete="off" />
        @if (results().length) {
          <ul class="absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-panel border border-border bg-surface p-1.5 shadow-lift">
            @for (item of results(); track item.externalKey ?? item.tmdbId ?? item.id) {
              <li>
                <button type="button" class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-elevated disabled:opacity-60" (click)="add(item)" [disabled]="!lists.canAdd(item) || contains(item)">
                  <app-poster class="aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-[3px]" [title]="item.title" [src]="item.posterApiLink" [mediaType]="item.mediaType" />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-semibold">{{ item.title }}</span>
                    <span class="block truncate text-[13px] text-muted">{{ typeKey(item.mediaType) | translate }}@if (item.year) {, {{ item.year }}}</span>
                  </span>
                  @if (contains(item)) { <svg lucideCheck [size]="17" class="text-success" /> } @else { <svg lucidePlus [size]="17" class="text-muted" /> }
                </button>
              </li>
            }
          </ul>
        }
      </div>

      <div class="mt-8">
        @if ((l.movies?.length ?? 0) === 0) {
          <app-empty-state [message]="'listDetail.emptyMessage' | translate" [hint]="'listDetail.emptyHint' | translate">
            <svg emptyIcon lucidePlus [size]="26" />
          </app-empty-state>
        } @else {
          <ol class="grid grid-cols-2 gap-x-4 gap-y-7 min-[480px]:grid-cols-3 sm:grid-cols-4 xl:grid-cols-5">
            @for (item of l.movies!; track item.id ?? $index) {
              <li class="relative">
                <app-media-card [item]="item" [headingLevel]="2" />
                <button
                  type="button"
                  class="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-paper backdrop-blur-sm transition hover:bg-danger"
                  (click)="remove(item)"
                  [attr.aria-label]="'watchlist.removeTitle' | translate: { title: item.title }"
                >
                  <svg lucideX [size]="15" />
                </button>
              </li>
            }
          </ol>
        }
      </div>
    } @else if (loading()) {
      <div class="skeleton h-12 w-1/2"></div>
      <div class="skeleton mt-6 h-11 w-full max-w-xl"></div>
    } @else {
      <app-empty-state [message]="'listDetail.notFound' | translate">
        <svg emptyIcon lucideArrowLeft [size]="26" />
        <a routerLink="/lists" class="btn-primary">{{ 'lists.title' | translate }}</a>
      </app-empty-state>
    }
  `,
})
export class ListDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  readonly lists = inject(ListService);
  private readonly media = inject(MediaService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  readonly runtime = inject(RuntimeService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly list = signal<MovieList | null>(null);
  readonly results = signal<MediaItem[]>([]);
  readonly loading = signal(true);
  readonly query = signal('');
  readonly confirmDelete = signal(false);
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(250),
        switchMap((q) => (q.length < 2 ? of([] as MediaItem[]) : this.searchAll(q))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => this.results.set(items.slice(0, 12)));
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) this.loadList(id);
      else this.loading.set(false);
    });
  }

  typeKey(type?: MediaType): string {
    return MEDIA_TYPE_KEYS[type ?? 'FILM'];
  }

  onQuery(q: string): void {
    this.query.set(q);
    this.search$.next(q.trim());
  }

  contains(item: MediaItem): boolean {
    return !!this.list()?.movies?.some(
      (m) => (m.id && m.id === item.id) || (m.tmdbId && m.tmdbId === item.tmdbId) || (m.externalKey && m.externalKey === item.externalKey)
    );
  }

  add(item: MediaItem): void {
    const list = this.list();
    if (!list) return;
    this.lists.addMedia(list.id, item).subscribe({
      next: (updated) => {
        this.list.set(updated);
        this.toast.success(this.i18n.translate('listDetail.movieAdded', { title: item.title }));
      },
      error: (err) => this.toast.error(errorMessage(err, this.i18n.translate('listDetail.couldNotAddMovie'))),
    });
  }

  remove(item: MediaItem): void {
    const list = this.list();
    if (!list || item.id == null) return;
    const before = list;
    this.list.set({ ...list, movies: list.movies?.filter((m) => m.id !== item.id) });
    this.lists.removeMovie(list.id, item.id).subscribe({
      next: () => this.toast.success(this.i18n.translate('listDetail.removed', { title: item.title })),
      error: () => {
        this.list.set(before);
        this.toast.error(this.i18n.translate('listDetail.couldNotRemove'));
      },
    });
  }

  /** Only the owner can delete, and only their own custom lists (not the diary or watchlist). */
  canDelete(list: MovieList): boolean {
    const me = this.auth.currentUser()?.username;
    return !!me && list.owner?.username === me && (list.listType ?? 'CUSTOM') === 'CUSTOM';
  }

  deleteList(): void {
    const list = this.list();
    if (!list) return;
    this.api.delete<void>(`/lists/${list.id}`).subscribe({
      next: () => {
        this.toast.success(this.i18n.translate('listDetail.deleted', { name: list.name }));
        this.router.navigate(['/lists']);
      },
      error: (err) => this.toast.error(errorMessage(err, this.i18n.translate('common.actionFailed'))),
    });
  }

  /** Films always; other types where the backend supports them. */
  private searchAll(q: string) {
    return this.media.search(this.runtime.demo() ? null : 'FILM', q).pipe(catchError(() => of([] as MediaItem[])));
  }

  private loadList(id: number): void {
    this.loading.set(true);
    this.lists.getById(id).subscribe({
      next: (list) => {
        this.list.set(list);
        this.loading.set(false);
        this.titleService.setTitle(`${list.name} · CritiComrade`);
      },
      error: () => {
        this.list.set(null);
        this.loading.set(false);
      },
    });
  }
}
