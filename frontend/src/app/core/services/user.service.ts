import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';
import { PageResponse, unwrapPage } from '../models/page-response.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private api: ApiService) {}

  getProfile(username: string): Observable<User> {
    return this.api.get<User>(`/users/${username}`);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.api.put<User>('/users/me', data);
  }

  searchUsers(query: string, page = 0, size = 20): Observable<User[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page)
      .set('size', size);
    return this.api
      .get<PageResponse<User>>('/users/search', params)
      .pipe(map((response) => unwrapPage(response)));
  }
}
