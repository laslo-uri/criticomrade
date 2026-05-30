import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  constructor(private api: ApiService) {}

  getPopularMovies(): Observable<Movie[]> {
    return this.api.get<Movie[]>('/movies/popular');
  }

  getMovieById(id: number): Observable<Movie> {
    return this.api.get<Movie>(`/movies/${id}`);
  }

  getMovieByTmdbId(tmdbId: number): Observable<Movie> {
    return this.api.get<Movie>(`/movies/tmdb/${tmdbId}`);
  }

  searchMovies(query: string): Observable<Movie[]> {
    const params = new HttpParams().set('q', query);
    return this.api.get<Movie[]>('/movies/search', params);
  }
}
