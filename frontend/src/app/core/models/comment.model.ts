import { User } from './user.model';

export interface Comment {
  id: number;
  text: string;
  reviewId?: number;
  user?: User;
  userId?: number;
  createdAt?: string;
  lastUpdated?: string;
}

export interface CommentCreateRequest {
  text: string;
}
