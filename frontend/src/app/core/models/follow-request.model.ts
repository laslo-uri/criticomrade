import { User } from './user.model';

export interface FollowRequest {
  id: number;
  sender?: User;
  receiver?: User;
  requestDateTime?: string;
}
