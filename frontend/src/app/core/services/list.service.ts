import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ListCreateRequest, MovieList } from '../models/list.model';
import { ListDto, mapList } from '../models/api-mappers';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  constructor(private api: ApiService) {}

  getMyLists(type?: string): Observable<MovieList[]> {
    let params: HttpParams | undefined;
    if (type) {
      params = new HttpParams().set('type', type);
    }
    return this.api
      .get<ListDto[]>('/lists', params)
      .pipe(map((lists) => lists.map(mapList)));
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

  addMovie(listId: number, tmdbId: number): Observable<MovieList> {
    return this.api
      .post<ListDto>(`/lists/${listId}/movies/${tmdbId}`, {})
      .pipe(map(mapList));
  }

  addReview(listId: number, reviewId: number): Observable<MovieList> {
    return this.api
      .post<ListDto>(`/lists/${listId}/reviews/${reviewId}`, {})
      .pipe(map(mapList));
  }

  removeMovie(listId: number, movieId: number): Observable<void> {
    return this.api.delete<void>(`/lists/${listId}/movies/${movieId}`);
  }
}
