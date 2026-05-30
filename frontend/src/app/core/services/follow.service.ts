import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';
import { FollowRequest } from '../models/follow-request.model';

@Injectable({
  providedIn: 'root',
})
export class FollowService {
  constructor(private api: ApiService) {}

  follow(username: string): Observable<void> {
    return this.api.post<void>(`/follow/request/${username}`, {});
  }

  unfollow(username: string): Observable<void> {
    return this.api.delete<void>(`/follow/${username}`);
  }

  acceptRequest(requestId: number): Observable<void> {
    return this.api.post<void>(`/follow/accept/${requestId}`, {});
  }

  rejectRequest(requestId: number): Observable<void> {
    return this.api.post<void>(`/follow/reject/${requestId}`, {});
  }

  getPendingRequests(): Observable<FollowRequest[]> {
    return this.api.get<FollowRequest[]>('/follow/requests');
  }

  getFollowers(username: string): Observable<User[]> {
    return this.api.get<User[]>(`/follow/followers/${username}`);
  }

  getFollowing(username: string): Observable<User[]> {
    return this.api.get<User[]>(`/follow/following/${username}`);
  }
}
