import { Component, computed, input } from '@angular/core';
import { MediaCardComponent } from '../media-card/media-card.component';
import { MediaItem, MediaType } from '../../../core/models/media-item.model';

@Component({
  selector: 'app-movie-card',
  imports: [MediaCardComponent],
  template: `<app-media-card [item]="item()" />`,
})
export class MovieCardComponent {
  movieId = input<number>();
  tmdbId = input<number>();
  title = input.required<string>();
  year = input<string>();
  posterUrl = input<string>();
  mediaType = input<MediaType>('FILM');
  externalKey = input<string>();
  creator = input<string>();

  item = computed<MediaItem>(() => ({
    id: this.movieId(),
    tmdbId: this.tmdbId(),
    title: this.title(),
    year: this.year(),
    posterApiLink: this.posterUrl(),
    mediaType: this.mediaType(),
    externalKey: this.externalKey(),
    creator: this.creator(),
  }));
}
