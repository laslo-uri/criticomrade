import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Comment, CommentCreateRequest } from '../models/comment.model';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(private api: ApiService) {}

  getForReview(reviewId: number): Observable<Comment[]> {
    return this.api.get<Comment[]>(`/reviews/${reviewId}/comments`);
  }

  add(reviewId: number, comment: CommentCreateRequest): Observable<Comment> {
    return this.api.post<Comment>(`/reviews/${reviewId}/comments`, comment);
  }

  delete(commentId: number): Observable<void> {
    return this.api.delete<void>(`/comments/${commentId}`);
  }
}
