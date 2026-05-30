import { Review } from './review.model';
import { User } from './user.model';
import { MovieList } from './list.model';

export interface ReactionSummaryDto {
  type: string;
  count: number;
  reactedByCurrentUser: boolean;
}

export interface ReviewDto {
  id: number;
  rating?: number;
  text?: string;
  movie?: {
    id: number;
    tmdbId?: number;
    title: string;
    year?: string;
    posterApiLink?: string;
  };
  author?: User;
  dateWatched?: string;
  seenBefore?: boolean;
  spoiler?: boolean;
  reviewTime?: string;
  lastUpdated?: string;
  commentCount?: number;
  reactions?: ReactionSummaryDto[];
}

export interface ListDto {
  id: number;
  name: string;
  listType?: string;
  privateList?: boolean;
  numberOfElements?: number;
  creationDate?: string;
  lastModificationDate?: string;
  owner?: User;
  movies?: ReviewDto['movie'][];
  reviews?: ReviewDto[];
}

export function mapReview(dto: ReviewDto): Review {
  const likeReaction = dto.reactions?.find((r) => r.type === 'LIKE');
  return {
    id: dto.id,
    rating: dto.rating != null ? dto.rating / 2 : undefined,
    text: dto.text,
    movie: dto.movie
      ? {
          id: dto.movie.id,
          tmdbId: dto.movie.tmdbId,
          title: dto.movie.title,
          year: dto.movie.year,
          posterApiLink: dto.movie.posterApiLink,
        }
      : undefined,
    user: dto.author,
    dateWatched: dto.dateWatched,
    seenBefore: dto.seenBefore,
    isContainedSpoiler: dto.spoiler,
    reviewTime: dto.reviewTime,
    lastUpdated: dto.lastUpdated,
    likeCount: likeReaction?.count ?? 0,
    commentCount: dto.commentCount ?? 0,
    likedByCurrentUser: likeReaction?.reactedByCurrentUser ?? false,
  };
}

export function mapReviews(dtos: ReviewDto[]): Review[] {
  return dtos.map(mapReview);
}

export function mapList(dto: ListDto): MovieList {
  return {
    id: dto.id,
    name: dto.name,
    listType: dto.listType as MovieList['listType'],
    isPrivateList: dto.privateList,
    numberOfElements: dto.numberOfElements,
    creationDate: dto.creationDate,
    lastModificationDate: dto.lastModificationDate,
    owner: dto.owner,
    movies: dto.movies?.map((m) =>
      m
        ? {
            id: m.id,
            tmdbId: m.tmdbId,
            title: m.title,
            year: m.year,
            posterApiLink: m.posterApiLink,
          }
        : { id: 0, title: '' }
    ),
    reviews: dto.reviews ? mapReviews(dto.reviews) : undefined,
  };
}

export function toBackendRating(uiRating: number): number {
  return uiRating * 2;
}

export function toUiRating(backendRating?: number): number {
  return backendRating != null ? backendRating / 2 : 0;
}
