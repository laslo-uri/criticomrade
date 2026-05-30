import { User } from './user.model';

export type NotificationType =
  | 'FOLLOW'
  | 'LIKE'
  | 'COMMENT'
  | 'FOLLOW_REQUEST'
  | 'RECOMMENDATION'
  | 'OTHER';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  actor?: User;
  referenceId?: number;
}
