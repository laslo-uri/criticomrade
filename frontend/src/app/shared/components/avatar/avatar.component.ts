import { Component, computed, input, signal } from '@angular/core';

const PALETTE = ['#C8262A', '#F2A93B', '#2E4057', '#5E6B3A', '#7A3B57', '#B4562F'];
const DARK_TEXT = new Set(['#F2A93B']);

/** Round avatar: the person's photo, or their initial on a colour picked from their name. */
@Component({
  selector: 'app-avatar',
  template: `
    <span
      class="avatar"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.font-size.px]="size() * 0.46"
      [style.background-color]="showImage() ? null : color()"
      [style.color]="textColor()"
    >
      @if (showImage()) {
        <img [src]="url()" alt="" class="h-full w-full object-cover" (error)="failedUrl.set(url() ?? null)" />
      } @else {
        {{ initial() }}
      }
    </span>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class AvatarComponent {
  readonly name = input<string | null | undefined>('');
  readonly url = input<string | null | undefined>(null);
  readonly size = input(40);

  /** Remembers which URL failed so a new URL gets a fresh try. */
  readonly failedUrl = signal<string | null>(null);
  readonly showImage = computed(() => !!this.url() && this.failedUrl() !== this.url());
  readonly initial = computed(() => (this.name() ?? '?').trim().charAt(0).toUpperCase() || '?');
  readonly color = computed(() => {
    const name = this.name() ?? '';
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return PALETTE[Math.abs(hash) % PALETTE.length];
  });
  readonly textColor = computed(() => (DARK_TEXT.has(this.color()) ? '#151011' : '#FBF5EE'));
}
