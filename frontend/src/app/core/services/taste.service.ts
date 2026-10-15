import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface GenreShare {
  name: string;
  count: number;
  percentage: number;
}

export interface TasteProfile {
  ratedCount: number;
  averageRating: number;
  genres: GenreShare[];
  mediaTypes: GenreShare[];
}

export interface Compatibility {
  sharedCount: number;
  percent: number | null;
}

export interface DiaryStats {
  year: number;
  yearCount: number;
  yearAverage: number;
  topGenre?: string | null;
  distribution: number[];
  mediaTypes: GenreShare[];
}

@Injectable({
  providedIn: 'root',
})
export class TasteService {
  constructor(private api: ApiService) {}

  profile(username: string): Observable<TasteProfile> {
    return this.api.get<TasteProfile>(`/users/${username}/taste-profile`);
  }

  compatibility(username: string): Observable<Compatibility> {
    return this.api.get<Compatibility>(`/users/${username}/compatibility`);
  }

  diary(username: string): Observable<DiaryStats> {
    return this.api.get<DiaryStats>(`/users/${username}/diary-stats`);
  }
}
