import { Component, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { LucideBell } from '@lucide/angular';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { Notification } from '../../core/models/notification.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, NgClass, TranslatePipe, LucideBell, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">{{ 'notifications.title' | translate }}</h1>
          <p class="text-muted">{{ 'notifications.subtitle' | translate }}</p>
        </div>
        @if (notifications().length) {
          <button type="button" class="btn-secondary text-sm" (click)="markAllRead()">
            {{ 'notifications.markAllRead' | translate }}
          </button>
        }
      </div>

      @if (notifications().length === 0 && !loading()) {
        <app-empty-state
          [message]="'notifications.emptyMessage' | translate"
          [hint]="'notifications.emptyHint' | translate"
        >
          <svg emptyIcon lucideBell [size]="48" class="mb-4 text-muted" />
        </app-empty-state>
      } @else {
        <ul class="space-y-2">
          @for (n of notifications(); track n.id) {
            <li
              class="card flex items-start gap-3 transition"
              [ngClass]="{ 'opacity-60': n.read, 'border-accent/20': !n.read }"
            >
              <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-medium">
                {{ n.actor?.username?.charAt(0)?.toUpperCase() ?? '?' }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm">{{ n.message }}</p>
                <p class="text-xs text-muted">{{ n.createdAt | date: 'medium' }}</p>
              </div>
              @if (!n.read) {
                <button
                  type="button"
                  class="shrink-0 text-xs text-accent hover:underline"
                  (click)="markRead(n)"
                >
                  {{ 'notifications.markRead' | translate }}
                </button>
              }
            </li>
          }
        </ul>
      }
      @if (loading()) {
        <p class="text-center text-muted">{{ 'common.loading' | translate }}</p>
      }
    </div>
  `,
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly translationService = inject(TranslationService);

  notifications = signal<Notification[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  markRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      this.notifications.update((items) =>
        items.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    });
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.map((n) => ({ ...n, read: true }))
        );
        this.toast.success(this.translationService.translate('notifications.allMarkedRead'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.notificationService.getAll().subscribe({
      next: (items) => {
        this.notifications.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
