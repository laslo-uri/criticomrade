import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Review, ReviewCreateRequest } from '../models/review.model';
import { PageResponse, unwrapPage } from '../models/page-response.model';
import {
  mapReview,
  mapReviews,
  ReviewDto,
  toBackendRating,
} from '../models/api-mappers';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  constructor(private api: ApiService) {}

  getFeed(page = 0, size = 20): Observable<Review[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api
      .get<PageResponse<ReviewDto>>('/feed', params)
      .pipe(map((response) => mapReviews(unwrapPage(response))));
  }

  getById(id: number): Observable<Review> {
    return this.api
      .get<ReviewDto>(`/reviews/${id}`)
      .pipe(map((dto) => mapReview(dto)));
  }

  getByUser(username: string, page = 0, size = 20): Observable<Review[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api
      .get<PageResponse<ReviewDto>>(`/users/${username}/reviews`, params)
      .pipe(map((response) => mapReviews(unwrapPage(response))));
  }

  getByMovie(movieId: number, page = 0, size = 20): Observable<Review[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api
      .get<PageResponse<ReviewDto>>(`/movies/${movieId}/reviews`, params)
      .pipe(map((response) => mapReviews(unwrapPage(response))));
  }

  create(review: ReviewCreateRequest): Observable<Review> {
    const payload = {
      ...review,
      rating:
        review.rating != null ? toBackendRating(review.rating) : undefined,
    };
    return this.api
      .post<ReviewDto>('/reviews', payload)
      .pipe(map((dto) => mapReview(dto)));
  }

  update(
    id: number,
    review: Partial<ReviewCreateRequest>
  ): Observable<Review> {
    const payload = {
      ...review,
      rating:
        review.rating != null ? toBackendRating(review.rating) : undefined,
    };
    return this.api
      .put<ReviewDto>(`/reviews/${id}`, payload)
      .pipe(map((dto) => mapReview(dto)));
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/reviews/${id}`);
  }
}
