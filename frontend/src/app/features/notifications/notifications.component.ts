import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideBell, LucideCheck } from '@lucide/angular';
import { FollowService } from '../../core/services/follow.service';
import { FollowRequest } from '../../core/models/follow-request.model';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { Notification } from '../../core/models/notification.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { UserRowComponent } from '../../shared/components/user-row/user-row.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TimeAgoPipe } from '../../core/pipes/time-ago.pipe';

@Component({
  selector: 'app-notifications',
  imports: [TranslatePipe, TimeAgoPipe, LucideBell, LucideCheck, EmptyStateComponent, AvatarComponent, UserRowComponent],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'notifications.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'notifications.subtitle' | translate }}</p>
      </div>
      @if (hasUnread()) {
        <button type="button" class="btn-secondary btn-sm" (click)="markAllRead()"><svg lucideCheck [size]="15" /> {{ 'notifications.markAllRead' | translate }}</button>
      }
    </header>

    @if (requests().length) {
      <section class="mb-8 rounded-panel border border-brass/40 bg-brass/5 px-4 py-1" [attr.aria-label]="'notifications.requests' | translate">
        <h2 class="pt-3 text-sm font-semibold text-brass-ink">{{ 'notifications.requests' | translate }}</h2>
        <div class="divide-y divide-border/60">
          @for (request of requests(); track request.id) {
            @if (request.sender; as sender) {
              <app-user-row [user]="sender" [detail]="'notifications.wantsToFollow' | translate">
                <div class="flex shrink-0 gap-1.5">
                  <button type="button" class="btn-primary btn-sm" (click)="answer(request, true)">{{ 'notifications.accept' | translate }}</button>
                  <button type="button" class="btn-ghost btn-sm" (click)="answer(request, false)">{{ 'notifications.decline' | translate }}</button>
                </div>
              </app-user-row>
            }
          }
        </div>
      </section>
    }

    @if (loading()) {
      @for (i of [1, 2, 3, 4]; track i) {
        <div class="flex items-center gap-3 py-3.5"><div class="skeleton h-10 w-10 rounded-full"></div><div class="skeleton h-4 flex-1"></div></div>
      }
    } @else if (items().length === 0) {
      <app-empty-state [message]="'notifications.emptyMessage' | translate" [hint]="'notifications.emptyHint' | translate">
        <svg emptyIcon lucideBell [size]="26" />
      </app-empty-state>
    } @else {
      <ul class="divide-y divide-border/60">
        @for (n of items(); track n.id) {
          <li>
            <button type="button" class="flex w-full items-start gap-3.5 rounded-lg px-2 py-3.5 text-left transition hover:bg-surface" (click)="open(n)">
              <app-avatar [name]="n.actor?.username ?? '?'" [url]="n.actor?.avatarUrl" [size]="40" />
              <span class="min-w-0 flex-1">
                <span class="block leading-snug" [class.font-semibold]="!n.read" [class.text-muted]="n.read">{{ n.message }}</span>
                <span class="mt-0.5 block text-[13px] text-muted">{{ n.createdAt | timeAgo }}</span>
              </span>
              @if (!n.read) {
                <span class="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" [attr.aria-label]="'notifications.unread' | translate"></span>
              }
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly notifications = inject(NotificationService);
  private readonly follows = inject(FollowService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly router = inject(Router);

  readonly items = signal<Notification[]>([]);
  readonly requests = signal<FollowRequest[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
    this.follows.getPendingRequests().subscribe({
      next: (requests) => this.requests.set(requests),
      error: () => this.requests.set([]),
    });
  }

  hasUnread(): boolean {
    return this.items().some((n) => !n.read);
  }

  open(n: Notification): void {
    if (!n.read) {
      this.items.update((all) => all.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      this.notifications.markAsRead(n.id).subscribe({ error: () => undefined });
    }
    switch (n.type) {
      case 'RECOMMENDATION':
        this.router.navigate(['/recommendations']);
        break;
      case 'LIKE':
      case 'COMMENT':
        this.router.navigate(['/profile', this.auth.currentUser()?.username]);
        break;
      default:
        if (n.actor?.username) this.router.navigate(['/profile', n.actor.username]);
    }
  }

  answer(request: FollowRequest, accept: boolean): void {
    const action = accept ? this.follows.acceptRequest(request.id) : this.follows.rejectRequest(request.id);
    action.subscribe({
      next: () => {
        this.requests.update((list) => list.filter((item) => item.id !== request.id));
        this.toast.success(this.i18n.translate(accept ? 'notifications.accepted' : 'notifications.declined', { username: request.sender?.username ?? '' }));
        this.load();
        this.notifications.refreshUnread();
      },
      error: () => this.toast.error(this.i18n.translate('common.actionFailed')),
    });
  }

  markAllRead(): void {
    this.notifications.markAllAsRead().subscribe({
      next: () => this.items.update((items) => items.map((n) => ({ ...n, read: true }))),
      error: () => this.toast.error(this.i18n.translate('common.actionFailed')),
    });
  }

  private load(): void {
    this.notifications.getAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
