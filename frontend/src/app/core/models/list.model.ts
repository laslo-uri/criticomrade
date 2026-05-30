import { Movie } from './movie.model';
import { User } from './user.model';
import { Review } from './review.model';

export type ListType = 'WATCHLIST' | 'DIARY' | 'CUSTOM';

export interface MovieList {
  id: number;
  name: string;
  listType?: ListType;
  isPrivateList?: boolean;
  numberOfElements?: number;
  creationDate?: string;
  lastModificationDate?: string;
  owner?: User;
  movies?: Movie[];
  reviews?: Review[];
}

export interface ListCreateRequest {
  name: string;
  listType: ListType;
  privateList?: boolean;
}
