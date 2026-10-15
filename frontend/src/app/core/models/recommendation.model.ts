import { Movie } from './movie.model';
import { User } from './user.model';

export type RecommendationStatus =
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PENDING'
  | 'COMPLETED';

export interface Recommendation {
  id: number;
  fromUser: User;
  toUser: User;
  movie: Movie;
  status: RecommendationStatus;
  creationTime: string;
  challengeDurationDays: number;
  endTime: string;
  challengePoints: number;
}

export interface RecommendationCreateRequest {
  toUsername: string;
  tmdbId?: number;
  /** Demo backend: recommend any title by catalogue key. */
  externalKey?: string;
  mediaType?: string;
  challengeDurationDays?: number;
  challengePoints?: number;
}
