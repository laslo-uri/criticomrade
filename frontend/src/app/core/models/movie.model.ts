export interface Movie {
  id: number;
  tmdbId?: number;
  title: string;
  description?: string;
  genre?: string;
  year?: string;
  letterboxdLink?: string;
  imdbLink?: string;
  rottenTomatoesLink?: string;
  youtubeTrailerLink?: string;
  posterApiLink?: string;
  imdbRating?: number;
  rottenTomatoesRating?: number;
}
