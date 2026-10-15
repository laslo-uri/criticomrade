export type MediaType = 'FILM' | 'SHOW' | 'EPISODE' | 'BOOK' | 'ALBUM';

export interface MediaItem {
  id?: number;
  tmdbId?: number;
  mediaType?: MediaType;
  externalKey?: string;
  creator?: string;
  title: string;
  description?: string;
  genre?: string;
  year?: string;
  letterboxdLink?: string;
  imdbLink?: string;
  rottenTomatoesLink?: string;
  youtubeTrailerLink?: string;
  posterApiLink?: string;
  backdropApiLink?: string;
  imdbRating?: number;
  rottenTomatoesRating?: number;
  network?: string;
  seasonCount?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  pageCount?: number;
  trackCount?: number;
  reviewCount?: number;
}
