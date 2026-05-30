import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ReactionSummaryDto } from '../models/api-mappers';

export type ReactionTarget = 'movie' | 'review' | 'comment';

@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  constructor(private api: ApiService) {}

  toggle(
    target: ReactionTarget,
    id: number,
    reactionType = 'LIKE'
  ): Observable<ReactionSummaryDto[]> {
    return this.api.post<ReactionSummaryDto[]>(
      `/reactions/${target}/${id}`,
      { reactionType }
    );
  }

  getReviewReactions(reviewId: number): Observable<ReactionSummaryDto[]> {
    return this.api.get<ReactionSummaryDto[]>(`/reactions/review/${reviewId}`);
  }

  getMovieReactions(movieId: number): Observable<ReactionSummaryDto[]> {
    return this.api.get<ReactionSummaryDto[]>(`/reactions/movie/${movieId}`);
  }

  getLikeCount(summaries: ReactionSummaryDto[]): number {
    return summaries.find((r) => r.type === 'LIKE')?.count ?? 0;
  }

  isLikedByCurrentUser(summaries: ReactionSummaryDto[]): boolean {
    return (
      summaries.find((r) => r.type === 'LIKE')?.reactedByCurrentUser ?? false
    );
  }
}
