import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RuntimeService } from './runtime.service';
import { ListCreateRequest, MovieList } from '../models/list.model';
import { MediaItem } from '../models/media-item.model';
import { ListDto, mapList } from '../models/api-mappers';

@Injectable({ providedIn: 'root' })
export class ListService {
  private readonly api = inject(ApiService);
  private readonly runtime = inject(RuntimeService);

  getMyLists(type?: string): Observable<MovieList[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.api.get<ListDto[]>('/lists', params).pipe(map((lists) => lists.map(mapList)));
  }

  getWatchlist(): Observable<MovieList> {
    return this.api.get<ListDto>('/lists/watchlist').pipe(map(mapList));
  }

  getDiary(): Observable<MovieList> {
    return this.api.get<ListDto>('/lists/diary').pipe(map(mapList));
  }

  getById(id: number): Observable<MovieList> {
    return this.api.get<ListDto>(`/lists/${id}`).pipe(map(mapList));
  }

  create(list: ListCreateRequest): Observable<MovieList> {
    return this.api.post<ListDto>('/lists', list).pipe(map(mapList));
  }

  /**
   * The Spring API adds titles by TMDB id (films). The demo backend also accepts
   * shows, books and albums by their catalogue key.
   */
  canAdd(item: MediaItem | null | undefined): boolean {
    return !!item && (!!item.tmdbId || (this.runtime.demo() && !!item.externalKey));
  }

  addMedia(listId: number, item: MediaItem): Observable<MovieList> {
    if (item.tmdbId) {
      return this.addMovie(listId, item.tmdbId);
    }
    return this.api
      .post<ListDto>(`/lists/${listId}/media`, { mediaType: item.mediaType, externalKey: item.externalKey })
      .pipe(map(mapList));
  }

  addMovie(listId: number, tmdbId: number): Observable<MovieList> {
    return this.api.post<ListDto>(`/lists/${listId}/movies/${tmdbId}`, {}).pipe(map(mapList));
  }

  addReview(listId: number, reviewId: number): Observable<MovieList> {
    return this.api.post<ListDto>(`/lists/${listId}/reviews/${reviewId}`, {}).pipe(map(mapList));
  }

  removeMovie(listId: number, movieId: number): Observable<void> {
    return this.api.delete<void>(`/lists/${listId}/movies/${movieId}`);
  }
}
