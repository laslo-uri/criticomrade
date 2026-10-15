import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Recommendation, RecommendationCreateRequest } from '../models/recommendation.model';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly api = inject(ApiService);

  create(request: RecommendationCreateRequest): Observable<Recommendation> {
    return this.api.post<Recommendation>('/recommendations', request);
  }

  getIncoming(): Observable<Recommendation[]> {
    return this.api.get<Recommendation[]>('/recommendations/incoming');
  }

  getOutgoing(): Observable<Recommendation[]> {
    return this.api.get<Recommendation[]>('/recommendations/outgoing');
  }

  accept(id: number): Observable<Recommendation> {
    return this.api.post<Recommendation>(`/recommendations/${id}/accept`, {});
  }

  reject(id: number): Observable<Recommendation> {
    return this.api.post<Recommendation>(`/recommendations/${id}/reject`, {});
  }

  complete(id: number): Observable<Recommendation> {
    return this.api.post<Recommendation>(`/recommendations/${id}/complete`, {});
  }
}
