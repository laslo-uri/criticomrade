import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { LucideSwords, LucidePlus, LucideTrophy, LucideHourglass, LucideSearch } from '@lucide/angular';
import { RecommendationService } from '../../core/services/recommendation.service';
import { MediaService } from '../../core/services/media.service';
import { FollowService } from '../../core/services/follow.service';
import { AuthService } from '../../core/services/auth.service';
import { RuntimeService } from '../../core/services/runtime.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { Recommendation, RecommendationStatus } from '../../core/models/recommendation.model';
import { MediaItem, MediaType } from '../../core/models/media-item.model';
import { User } from '../../core/models/user.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TimeAgoPipe } from '../../core/pipes/time-ago.pipe';
import { mediaLink } from '../../core/utils/media-link';
import { errorMessage } from '../../core/utils/http-error';

type RecTab = 'incoming' | 'outgoing';

@Component({
  selector: 'app-recommendations',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    TimeAgoPipe,
    LucideSwords,
    LucidePlus,
    LucideTrophy,
    LucideHourglass,
    LucideSearch,
    EmptyStateComponent,
    ModalComponent,
    PosterComponent,
    AvatarComponent,
  ],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'recommendations.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'recommendations.subtitle' | translate }}</p>
      </div>
      <button type="button" class="btn-primary" (click)="openCreate()"><svg lucidePlus [size]="17" /> {{ 'recommendations.new' | translate }}</button>
    </header>

    <div class="tabs" role="tablist">
      <button type="button" role="tab" class="tab" [class.tab-active]="tab() === 'incoming'" [attr.aria-selected]="tab() === 'incoming'" (click)="setTab('incoming')">
        {{ 'recommendations.tabIncoming' | translate }}
        @if (pendingIncoming()) { <span class="ml-1 rounded-full bg-accent px-1.5 text-[11px] font-bold text-paper">{{ pendingIncoming() }}</span> }
      </button>
      <button type="button" role="tab" class="tab" [class.tab-active]="tab() === 'outgoing'" [attr.aria-selected]="tab() === 'outgoing'" (click)="setTab('outgoing')">
        {{ 'recommendations.tabOutgoing' | translate }}
      </button>
    </div>

    <div class="mt-4">
      @if (loading()) {
        @for (i of [1, 2]; track i) { <div class="skeleton my-3 h-28 w-full"></div> }
      } @else if (items().length === 0) {
        <app-empty-state [message]="'recommendations.emptyMessage' | translate" [hint]="(tab() === 'incoming' ? 'recommendations.emptyIncoming' : 'recommendations.emptyOutgoing') | translate">
          <svg emptyIcon lucideSwords [size]="26" />
          <button type="button" class="btn-primary" (click)="openCreate()">{{ 'recommendations.new' | translate }}</button>
        </app-empty-state>
      } @else {
        <ul class="divide-y divide-border/60">
          @for (rec of items(); track rec.id) {
            <li class="flex gap-4 py-5">
              <a [routerLink]="link(rec).commands" [queryParams]="link(rec).queryParams" class="w-16 shrink-0 sm:w-20">
                <app-poster class="aspect-[2/3] overflow-hidden rounded-[4px] shadow-poster" [title]="rec.movie.title" [src]="rec.movie.posterApiLink" [mediaType]="rec.movie.mediaType" [year]="rec.movie.year" />
              </a>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <a [routerLink]="link(rec).commands" [queryParams]="link(rec).queryParams" class="font-display text-2xl font-bold uppercase leading-none hover:text-accent-ink">{{ rec.movie.title }}</a>
                  <span class="tag text-[12px]" [class]="statusClass(rec.status)">{{ 'recommendations.status.' + rec.status | translate }}</span>
                </div>
                @if (tab() === 'incoming' ? rec.fromUser : rec.toUser; as other) {
                  <p class="mt-2 flex items-center gap-2 text-sm">
                    <app-avatar [name]="other.username" [url]="other.avatarUrl" [size]="22" />
                    <a [routerLink]="['/profile', other.username]" class="font-semibold hover:text-accent-ink">{{ other.username }}</a>
                    <span class="text-muted">{{ (tab() === 'incoming' ? 'recommendations.challengedYou' : 'recommendations.youChallenged') | translate }}, {{ rec.creationTime | timeAgo }}</span>
                  </p>
                }
                <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                  <span class="inline-flex items-center gap-1"><svg lucideTrophy [size]="13" class="text-brass-ink" /> {{ 'recommendations.points' | translate: { points: rec.challengePoints } }}</span>
                  @if (rec.status === 'PENDING' || rec.status === 'ACCEPTED') {
                    <span class="inline-flex items-center gap-1"><svg lucideHourglass [size]="13" /> {{ deadline(rec) }}</span>
                  }
                </p>
                @if (tab() === 'incoming') {
                  <div class="mt-3 flex flex-wrap gap-2">
                    @if (rec.status === 'PENDING') {
                      <button type="button" class="btn-primary btn-sm" (click)="act(rec, 'accept')">{{ 'recommendations.accept' | translate }}</button>
                      <button type="button" class="btn-ghost btn-sm" (click)="act(rec, 'reject')">{{ 'recommendations.reject' | translate }}</button>
                    }
                    @if (rec.status === 'ACCEPTED') {
                      <button type="button" class="btn-brass btn-sm" (click)="act(rec, 'complete')">{{ 'recommendations.complete' | translate }}</button>
                    }
                  </div>
                }
              </div>
            </li>
          }
        </ul>
      }
    </div>

    <app-modal [open]="createOpen()" [title]="'recommendations.sendTitle' | translate" (closed)="createOpen.set(false)">
      <form class="space-y-5" (ngSubmit)="create()">
        <label class="block">
          <span class="field-label">{{ 'recommendations.friendUsername' | translate }}</span>
          <input type="text" class="input-field" [(ngModel)]="toUsername" name="to" required list="challenge-friends" autocomplete="off" autocapitalize="none" />
          <datalist id="challenge-friends">
            @for (f of friends(); track f.id) { <option [value]="f.username">{{ f.fullName || f.username }}</option> }
          </datalist>
          @if (friends().length) {
            <div class="mt-2 flex flex-wrap gap-1.5">
              @for (f of friends().slice(0, 6); track f.id) {
                <button type="button" class="chip !min-h-8" [class.chip-active]="toUsername === f.username" (click)="toUsername = f.username">{{ f.username }}</button>
              }
            </div>
          }
        </label>

        <div>
          <span class="field-label">{{ 'recommendations.whatTitle' | translate }}</span>
          @if (selected(); as m) {
            <div class="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <app-poster class="aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-[3px]" [title]="m.title" [src]="m.posterApiLink" [mediaType]="m.mediaType" />
              <span class="min-w-0 flex-1 truncate font-semibold">{{ m.title }}</span>
              <button type="button" class="text-[13px] font-semibold text-accent-ink hover:underline" (click)="selected.set(null)">{{ 'reviewModal.changeTitle' | translate }}</button>
            </div>
          } @else {
            <div class="relative">
              <svg lucideSearch [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input type="search" class="input-field pl-10" [placeholder]="'recommendations.searchMovie' | translate" [ngModel]="movieQuery()" (ngModelChange)="onMovieQuery($event)" name="movieQuery" autocomplete="off" />
            </div>
            @if (movieResults().length) {
              <ul class="mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-border p-1">
                @for (m of movieResults(); track m.externalKey ?? m.tmdbId ?? m.id) {
                  <li>
                    <button type="button" class="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-elevated" (click)="selected.set(m); movieResults.set([])">
                      <app-poster class="aspect-[2/3] w-8 shrink-0 overflow-hidden rounded-[2px]" [title]="m.title" [src]="m.posterApiLink" [mediaType]="m.mediaType" />
                      <span class="min-w-0 truncate text-sm"><strong>{{ m.title }}</strong> <span class="text-muted">{{ m.year }}</span></span>
                    </button>
                  </li>
                }
              </ul>
            }
          }
        </div>

        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="field-label">{{ 'recommendations.days' | translate }}</span>
            <input type="number" class="input-field" [(ngModel)]="durationDays" name="days" min="1" max="90" required />
          </label>
          <label class="block">
            <span class="field-label">{{ 'recommendations.pointsLabel' | translate }}</span>
            <input type="number" class="input-field" [(ngModel)]="points" name="points" min="0" max="100" required />
          </label>
        </div>
        <button type="submit" class="btn-primary w-full" [disabled]="!selected() || !toUsername.trim() || sending()">{{ 'recommendations.send' | translate }}</button>
      </form>
    </app-modal>
  `,
})
export class RecommendationsComponent implements OnInit {
  private readonly recs = inject(RecommendationService);
  private readonly media = inject(MediaService);
  private readonly follows = inject(FollowService);
  private readonly auth = inject(AuthService);
  private readonly runtime = inject(RuntimeService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly tab = signal<RecTab>('incoming');
  readonly items = signal<Recommendation[]>([]);
  readonly incoming = signal<Recommendation[]>([]);
  readonly loading = signal(true);
  readonly createOpen = signal(false);
  readonly sending = signal(false);
  readonly friends = signal<User[]>([]);
  readonly movieQuery = signal('');
  readonly movieResults = signal<MediaItem[]>([]);
  readonly selected = signal<MediaItem | null>(null);
  readonly pendingIncoming = computed(() => this.incoming().filter((r) => r.status === 'PENDING').length);

  toUsername = '';
  durationDays = 7;
  points = 10;

  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(250),
        switchMap((q) =>
          q.length < 2 ? of([] as MediaItem[]) : this.media.search(this.runtime.demo() ? null : 'FILM', q).pipe(catchError(() => of([] as MediaItem[])))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => this.movieResults.set(items.slice(0, 10)));

    // Arriving from a title page: open the form with that title picked.
    const q = this.route.snapshot.queryParamMap;
    if (q.get('title')) {
      this.selected.set({
        title: q.get('title')!,
        tmdbId: q.get('tmdbId') ? Number(q.get('tmdbId')) : undefined,
        externalKey: q.get('key') ?? undefined,
        mediaType: (q.get('type') as MediaType) ?? 'FILM',
      });
      this.openCreate();
    }
    this.load();
  }

  link(rec: Recommendation) {
    return mediaLink(rec.movie);
  }

  setTab(tab: RecTab): void {
    this.tab.set(tab);
    this.load();
  }

  openCreate(): void {
    this.createOpen.set(true);
    const me = this.auth.currentUser()?.username;
    if (me && this.friends().length === 0) {
      this.follows.getFollowing(me).subscribe({ next: (f) => this.friends.set(f), error: () => undefined });
    }
  }

  onMovieQuery(q: string): void {
    this.movieQuery.set(q);
    this.search$.next(q.trim());
  }

  statusClass(status: RecommendationStatus): string {
    return {
      PENDING: 'bg-brass/15 text-brass-ink',
      ACCEPTED: 'bg-accent/15 text-accent-ink',
      COMPLETED: 'bg-success/15 text-success',
      REJECTED: 'bg-elevated text-muted',
    }[status];
  }

  deadline(rec: Recommendation): string {
    const end = rec.endTime ? new Date(rec.endTime) : null;
    if (!end || isNaN(end.getTime())) return this.i18n.translate('recommendations.daysTotal', { days: rec.challengeDurationDays });
    const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
    return days <= 0
      ? this.i18n.translate('recommendations.overdue')
      : this.i18n.translate('recommendations.daysLeft', { count: days });
  }

  create(): void {
    const media = this.selected();
    const to = this.toUsername.trim();
    if (!media || !to || this.sending()) return;
    if (!media.tmdbId && !this.runtime.demo()) {
      this.toast.error(this.i18n.translate('recommendations.filmsOnly'));
      return;
    }
    this.sending.set(true);
    this.recs
      .create({
        toUsername: to,
        tmdbId: media.tmdbId,
        externalKey: media.tmdbId ? undefined : media.externalKey,
        mediaType: media.mediaType,
        challengeDurationDays: Number(this.durationDays) || 7,
        challengePoints: Number(this.points) || 0,
      })
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.translate('recommendations.sent', { username: to }));
          this.sending.set(false);
          this.createOpen.set(false);
          this.selected.set(null);
          this.movieQuery.set('');
          this.toUsername = '';
          this.tab.set('outgoing');
          this.load();
        },
        error: (err) => {
          this.sending.set(false);
          this.toast.error(errorMessage(err, this.i18n.translate('recommendations.sendFailed')));
        },
      });
  }

  act(rec: Recommendation, action: 'accept' | 'reject' | 'complete'): void {
    const request = action === 'accept' ? this.recs.accept(rec.id) : action === 'reject' ? this.recs.reject(rec.id) : this.recs.complete(rec.id);
    request.subscribe({
      next: () => {
        const key = { accept: 'recommendations.accepted', reject: 'recommendations.rejected', complete: 'recommendations.markedComplete' }[action];
        this.toast.success(this.i18n.translate(key, { points: rec.challengePoints }));
        this.load();
        if (action === 'complete') this.auth.refreshCurrentUser().subscribe({ error: () => undefined });
      },
      error: (err) => this.toast.error(errorMessage(err, this.i18n.translate('recommendations.failed'))),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.recs.getIncoming().subscribe({
      next: (items) => {
        this.incoming.set(items);
        if (this.tab() === 'incoming') {
          this.items.set(items);
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
    if (this.tab() === 'outgoing') {
      this.recs.getOutgoing().subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }
}
