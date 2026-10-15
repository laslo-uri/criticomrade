import { MediaItem, MediaType } from '../models/media-item.model';

export interface MediaLink {
  commands: (string | number)[];
  queryParams: Record<string, string> | null;
}

/** Where a title's detail page lives, whether or not it has been stored yet. */
export function mediaLink(item: Partial<MediaItem> | null | undefined): MediaLink {
  if (!item) return { commands: ['/explore'], queryParams: null };
  const type: MediaType = item.mediaType ?? 'FILM';
  if (item.id) return { commands: ['/media', item.id], queryParams: null };
  if (item.tmdbId && type === 'FILM') return { commands: ['/movies/tmdb', item.tmdbId], queryParams: null };
  const key = item.externalKey ?? '';
  const bare = key.includes(':') ? key.slice(key.indexOf(':') + 1) : key;
  return { commands: ['/media/resolve'], queryParams: { type, key: bare } };
}

export const MEDIA_TYPE_KEYS: Record<MediaType, string> = {
  FILM: 'media.film',
  SHOW: 'media.show',
  EPISODE: 'media.episode',
  BOOK: 'media.book',
  ALBUM: 'media.album',
};
