export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  profilePublic?: boolean;
  gainedChallengePoints?: number;
  followerCount?: number;
  followingCount?: number;
  following?: boolean;
}
