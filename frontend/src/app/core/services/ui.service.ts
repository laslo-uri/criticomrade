import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { MediaItem } from '../models/media-item.model';

/** App-wide UI state: the "log a title" dialog can be opened from anywhere. */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly reviewOpen = signal(false);
  readonly reviewMedia = signal<MediaItem | null>(null);
  /** Emits after a review is published so open pages can refresh. */
  readonly reviewPublished$ = new Subject<void>();

  openReview(media: MediaItem | null = null): void {
    this.reviewMedia.set(media);
    this.reviewOpen.set(true);
  }

  closeReview(): void {
    this.reviewOpen.set(false);
    this.reviewMedia.set(null);
  }
}
