import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Notification } from '../models/notification.model';
import { PageResponse, unwrapPage } from '../models/page-response.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  /** Shared unread badge count for the navbar, sidebar and bottom bar. */
  readonly unread = signal(0);

  getAll(page = 0, size = 30): Observable<Notification[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api
      .get<PageResponse<Notification>>('/notifications', params)
      .pipe(map((response) => unwrapPage(response)));
  }

  getUnreadCount(): Observable<number> {
    return this.api.get<number>('/notifications/unread-count');
  }

  refreshUnread(): void {
    this.getUnreadCount().subscribe({
      next: (count) => this.unread.set(Number(count) || 0),
      error: () => this.unread.set(0),
    });
  }

  markAsRead(id: number): Observable<void> {
    return this.api
      .patch<void>(`/notifications/${id}/read`, {})
      .pipe(tap(() => this.unread.update((n) => Math.max(0, n - 1))));
  }

  markAllAsRead(): Observable<void> {
    return this.api.patch<void>('/notifications/read-all', {}).pipe(tap(() => this.unread.set(0)));
  }
}
