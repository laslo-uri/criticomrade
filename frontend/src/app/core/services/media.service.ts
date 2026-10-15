import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MediaItem, MediaType } from '../models/media-item.model';

export interface MediaCredits {
  cast: string[];
  tracks: string[];
}

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  constructor(private api: ApiService) {}

  search(type: MediaType, query: string): Observable<MediaItem[]> {
    const params = new HttpParams().set('type', type).set('q', query);
    return this.api.get<MediaItem[]>('/media/search', params);
  }

  popular(type: MediaType): Observable<MediaItem[]> {
    const params = new HttpParams().set('type', type);
    return this.api.get<MediaItem[]>('/media/popular', params);
  }

  resolve(type: MediaType, key: string): Observable<MediaItem> {
    const params = new HttpParams().set('type', type).set('key', key);
    return this.api.get<MediaItem>('/media/resolve', params);
  }

  credits(type: MediaType, key: string): Observable<MediaCredits> {
    const params = new HttpParams().set('type', type).set('key', key);
    return this.api.get<MediaCredits>('/media/credits', params);
  }

  suggestions(): Observable<MediaItem[]> {
    return this.api.get<MediaItem[]>('/users/me/suggestions');
  }
}
