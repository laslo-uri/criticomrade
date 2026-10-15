import { Component, computed, input, signal } from '@angular/core';
import { MediaType } from '../../../core/models/media-item.model';

interface Palette {
  bg: string;
  shape: string;
  accent: string;
  text: string;
}

const PALETTES: Palette[] = [
  { bg: '#C8262A', shape: '#151011', accent: '#F2A93B', text: '#FBF5EE' },
  { bg: '#F2A93B', shape: '#C8262A', accent: '#151011', text: '#151011' },
  { bg: '#F4EBE1', shape: '#C8262A', accent: '#151011', text: '#151011' },
  { bg: '#1E1718', shape: '#C8262A', accent: '#F2A93B', text: '#FBF5EE' },
  { bg: '#2E4057', shape: '#F2A93B', accent: '#F4EBE1', text: '#FBF5EE' },
  { bg: '#5E6B3A', shape: '#F4EBE1', accent: '#C8262A', text: '#FBF5EE' },
];

const TYPE_LABEL: Record<MediaType, string> = {
  FILM: 'Film',
  SHOW: 'Series',
  EPISODE: 'Episode',
  BOOK: 'Book',
  ALBUM: 'Album',
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Breaks a title into poster lines of roughly `max` characters, never splitting words. */
function wrap(title: string, max: number): string[] {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (!line) line = word;
    else if ((line + ' ' + word).length <= max) line += ' ' + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

/**
 * Poster for a title. Uses the real artwork when there is one; otherwise draws a
 * constructivist poster from the title so every card has a cover.
 */
@Component({
  selector: 'app-poster',
  template: `
    <div class="relative h-full w-full overflow-hidden bg-elevated">
      @if (showImage()) {
        <img
          [src]="src()"
          [alt]="title()"
          [attr.loading]="eager() ? 'eager' : 'lazy'"
          decoding="async"
          class="h-full w-full object-cover"
          (error)="failedUrl.set(src() ?? null)"
        />
      } @else {
        <svg viewBox="0 0 200 300" class="block h-full w-full" role="img" [attr.aria-label]="title()" preserveAspectRatio="xMidYMid slice">
          <rect width="200" height="300" [attr.fill]="art().p.bg" />
          @switch (art().layout) {
            @case (0) {
              @for (ray of rays; track ray) {
                <polygon [attr.points]="ray" [attr.fill]="art().p.shape" opacity="0.9" />
              }
              <circle cx="178" cy="54" r="26" [attr.fill]="art().p.accent" />
            }
            @case (1) {
              <circle [attr.cx]="art().x" cy="96" r="74" [attr.fill]="art().p.shape" />
              <rect x="0" y="176" width="200" height="10" [attr.fill]="art().p.accent" />
            }
            @case (2) {
              <rect x="-60" y="96" width="340" height="62" [attr.fill]="art().p.shape" transform="rotate(-24 100 127)" />
              <rect x="-60" y="168" width="340" height="8" [attr.fill]="art().p.accent" transform="rotate(-24 100 172)" />
            }
            @case (3) {
              @for (i of stripes; track i) {
                <rect x="0" [attr.y]="34 + i * 20" width="200" height="10" [attr.fill]="art().p.shape" />
              }
              <rect x="118" y="52" width="56" height="56" [attr.fill]="art().p.accent" />
            }
            @case (4) {
              <rect x="0" y="0" [attr.width]="art().x" height="186" [attr.fill]="art().p.shape" />
              <circle [attr.cx]="art().x" cy="118" r="40" [attr.fill]="art().p.accent" />
              <rect [attr.x]="art().x - 6" y="20" width="12" height="166" [attr.fill]="art().p.text" opacity="0.85" />
            }
            @default {
              <circle cx="100" cy="190" r="92" [attr.fill]="art().p.shape" />
              @for (ray of sun; track ray) {
                <line x1="100" y1="190" [attr.x2]="ray[0]" [attr.y2]="ray[1]" [attr.stroke]="art().p.accent" stroke-width="5" />
              }
              <rect x="0" y="190" width="200" height="110" [attr.fill]="art().p.bg" />
            }
          }
          <text
            x="14"
            y="24"
            [attr.fill]="art().p.text"
            font-family="Instrument Sans, system-ui, sans-serif"
            font-size="11"
            font-weight="600"
            opacity="0.92"
          >{{ label() }}</text>
          @for (line of art().lines; track $index) {
            <text
              x="12"
              [attr.y]="art().baseY + $index * art().size * 0.9"
              [attr.fill]="art().p.text"
              font-family="Big Shoulders Display, Arial Narrow, Impact, sans-serif"
              font-weight="800"
              [attr.font-size]="art().size"
              letter-spacing="0.5"
            >{{ line }}</text>
          }
          @if (creator()) {
            <text
              x="14"
              y="290"
              [attr.fill]="art().p.text"
              font-family="Instrument Sans, system-ui, sans-serif"
              font-size="10"
              opacity="0.8"
            >{{ creatorLine() }}</text>
          }
        </svg>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class PosterComponent {
  readonly title = input.required<string>();
  readonly src = input<string | null | undefined>(null);
  readonly mediaType = input<MediaType | null | undefined>('FILM');
  readonly year = input<string | null | undefined>('');
  readonly creator = input<string | null | undefined>('');
  readonly eager = input(false);

  /** Remembers which URL failed so a new URL gets a fresh try. */
  readonly failedUrl = signal<string | null>(null);
  readonly showImage = computed(() => !!this.src() && this.failedUrl() !== this.src());

  readonly rays = Array.from({ length: 7 }, (_, i) => {
    const a1 = (-80 + i * 13) * (Math.PI / 180);
    const a2 = a1 + 6.5 * (Math.PI / 180);
    const r = 480;
    return `-10,310 ${-10 + r * Math.cos(a1)},${310 + r * Math.sin(a1)} ${-10 + r * Math.cos(a2)},${310 + r * Math.sin(a2)}`;
  });
  readonly stripes = [0, 1, 2, 3, 4, 5];
  readonly sun = Array.from({ length: 9 }, (_, i) => {
    const a = (-170 + i * 20) * (Math.PI / 180);
    return [100 + 190 * Math.cos(a), 190 + 190 * Math.sin(a)];
  });

  readonly label = computed(() => {
    const type = TYPE_LABEL[this.mediaType() ?? 'FILM'] ?? 'Film';
    return this.year() ? `${type}, ${this.year()}` : type;
  });

  readonly creatorLine = computed(() => {
    const c = this.creator() ?? '';
    return c.length > 30 ? c.slice(0, 29) + '…' : c;
  });

  readonly art = computed(() => {
    const title = this.title() || 'Untitled';
    const h = hash(title + (this.mediaType() ?? ''));
    const p = PALETTES[h % PALETTES.length];
    const layout = (h >>> 4) % 6;
    const lines = wrap(title, title.length > 28 ? 12 : 10);
    const longest = Math.max(...lines.map((l) => l.length), 4);
    const size = Math.max(22, Math.min(54, Math.floor(176 / (longest * 0.5))));
    const height = lines.length * size * 0.9;
    const baseY = 266 - height + size * 0.9 - (this.creator() ? 4 : -10);
    return { p, layout, lines, size, baseY, x: 60 + ((h >>> 9) % 90) };
  });
}
