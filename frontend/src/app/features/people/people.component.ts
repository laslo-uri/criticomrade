import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, switchMap, catchError, of, tap } from 'rxjs';
import { LucideSearch, LucideUserCheck, LucideUserPlus, LucideUsers, LucideClock } from '@lucide/angular';
import { UserService } from '../../core/services/user.service';
import { FollowService } from '../../core/services/follow.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { User } from '../../core/models/user.model';
import { UserRowComponent } from '../../shared/components/user-row/user-row.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { errorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-people',
  imports: [FormsModule, RouterLink, TranslatePipe, UserRowComponent, EmptyStateComponent, LucideSearch, LucideUserPlus, LucideUserCheck, LucideUsers, LucideClock],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'people.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'people.subtitle' | translate }}</p>
      </div>
    </header>

    <form class="relative max-w-md" role="search" (submit)="$event.preventDefault()">
      <label class="sr-only" for="people-q">{{ 'people.searchLabel' | translate }}</label>
      <svg lucideSearch [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input id="people-q" type="search" class="input-field pl-10" [placeholder]="'people.searchPlaceholder' | translate" [ngModel]="query()" (ngModelChange)="onQuery($event)" name="q" autocomplete="off" />
    </form>

    <section class="mt-6" aria-live="polite">
      @if (loading() && people().length === 0) {
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="flex items-center gap-3 py-3">
            <div class="skeleton h-11 w-11 rounded-full"></div>
            <div class="flex-1 space-y-2"><div class="skeleton h-4 w-40"></div><div class="skeleton h-3 w-24"></div></div>
          </div>
        }
      } @else if (people().length === 0) {
        <app-empty-state [message]="'people.empty' | translate" [hint]="'people.emptyHint' | translate">
          <svg emptyIcon lucideUsers [size]="26" />
        </app-empty-state>
      } @else {
        <div class="divide-y divide-border/60">
          @for (person of people(); track person.id) {
            <app-user-row [user]="person" [detail]="person.bio ?? ''">
              @if (auth.isLoggedIn() && person.username !== auth.currentUser()?.username) {
                @if (person.following) {
                  <button type="button" class="btn-secondary btn-sm shrink-0" (click)="toggle(person)" [disabled]="busy() === person.id" [attr.aria-label]="'profile.following' | translate">
                    <svg lucideUserCheck [size]="15" /> <span class="hidden sm:inline">{{ 'profile.following' | translate }}</span>
                  </button>
                } @else if (person.followRequested) {
                  <button type="button" class="btn-secondary btn-sm shrink-0" (click)="toggle(person)" [disabled]="busy() === person.id" [attr.aria-label]="'profile.requested' | translate">
                    <svg lucideClock [size]="15" /> <span class="hidden sm:inline">{{ 'profile.requested' | translate }}</span>
                  </button>
                } @else {
                  <button type="button" class="btn-primary btn-sm shrink-0" (click)="toggle(person)" [disabled]="busy() === person.id" [attr.aria-label]="'profile.follow' | translate">
                    <svg lucideUserPlus [size]="15" /> <span class="hidden sm:inline">{{ 'profile.follow' | translate }}</span>
                  </button>
                }
              } @else if (!auth.isLoggedIn()) {
                <a routerLink="/auth/login" class="btn-secondary btn-sm shrink-0">{{ 'profile.follow' | translate }}</a>
              }
            </app-user-row>
          }
        </div>
      }
    </section>
  `,
})
export class PeopleComponent implements OnInit {
  private readonly users = inject(UserService);
  private readonly follows = inject(FollowService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly people = signal<User[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<number | null>(null);
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(250),
        tap(() => this.loading.set(true)),
        switchMap((q) => this.users.searchUsers(q, 0, 50).pipe(catchError(() => of([] as User[])))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((people) => {
        this.people.set(people);
        this.loading.set(false);
      });
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.query.set(q);
    this.search$.next(q);
  }

  onQuery(q: string): void {
    this.query.set(q);
    this.router.navigate([], { queryParams: { q: q.trim() || null }, replaceUrl: true });
    this.search$.next(q.trim());
  }

  toggle(person: User): void {
    this.busy.set(person.id);
    const leaving = person.following || person.followRequested;
    const action = leaving ? this.follows.unfollow(person.username) : this.follows.follow(person.username);
    action.subscribe({
      next: () =>
        this.users.getProfile(person.username).subscribe({
          next: (fresh) => {
            this.people.update((all) => all.map((p) => (p.id === fresh.id ? { ...p, ...fresh, bio: p.bio } : p)));
            this.busy.set(null);
            const key = leaving ? 'profile.unfollowed' : fresh.following ? 'profile.nowFollowing' : 'profile.followRequestSent';
            this.toast.success(this.i18n.translate(key, { username: person.username }));
          },
          error: () => this.busy.set(null),
        }),
      error: (err) => {
        this.busy.set(null);
        this.toast.error(errorMessage(err, this.i18n.translate('common.actionFailed')));
      },
    });
  }
}
