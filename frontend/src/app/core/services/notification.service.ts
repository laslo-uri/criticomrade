import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Notification } from '../models/notification.model';
import { PageResponse, unwrapPage } from '../models/page-response.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 20): Observable<Notification[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api
      .get<PageResponse<Notification>>('/notifications', params)
      .pipe(map((response) => unwrapPage(response)));
  }

  getUnreadCount(): Observable<number> {
    return this.api.get<number>('/notifications/unread-count');
  }

  markAsRead(id: number): Observable<void> {
    return this.api.patch<void>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.api.patch<void>('/notifications/read-all', {});
  }
}
