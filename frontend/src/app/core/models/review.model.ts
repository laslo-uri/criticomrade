import { Movie } from './movie.model';
import { User } from './user.model';

export interface Review {
  id: number;
  rating?: number;
  text?: string;
  movie?: Movie;
  movieId?: number;
  user?: User;
  userId?: number;
  dateWatched?: string;
  seenBefore?: boolean;
  isContainedSpoiler?: boolean;
  reviewTime?: string;
  lastUpdated?: string;
  likeCount?: number;
  commentCount?: number;
  likedByCurrentUser?: boolean;
}

export interface ReviewCreateRequest {
  tmdbId?: number;
  externalKey?: string;
  mediaType?: string;
  rating?: number;
  text?: string;
  dateWatched?: string;
  seenBefore?: boolean;
  spoiler?: boolean;
}
