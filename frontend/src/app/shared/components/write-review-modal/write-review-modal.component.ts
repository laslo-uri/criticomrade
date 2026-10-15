import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { LucideSearch } from '@lucide/angular';
import { MediaService } from '../../../core/services/media.service';
import { ReviewService } from '../../../core/services/review.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { MediaItem, MediaType } from '../../../core/models/media-item.model';
import { ModalComponent } from '../modal/modal.component';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { PosterComponent } from '../poster/poster.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { MEDIA_TYPE_KEYS } from '../../../core/utils/media-link';
import { errorMessage } from '../../../core/utils/http-error';

const TYPES: MediaType[] = ['FILM', 'SHOW', 'BOOK', 'ALBUM'];

@Component({
  selector: 'app-write-review-modal',
  imports: [FormsModule, TranslatePipe, ModalComponent, StarRatingComponent, PosterComponent, LucideSearch],
  template: `
    <app-modal [open]="open()" [title]="'reviewModal.title' | translate" (closed)="close()">
      @if (!selected()) {
        <div class="space-y-3">
          <div class="flex flex-wrap gap-1.5" role="tablist">
            @for (type of types; track type) {
              <button type="button" role="tab" class="chip" [class.chip-active]="searchType() === type" [attr.aria-selected]="searchType() === type" (click)="setType(type)">
                {{ typeKeys[type] | translate }}
              </button>
            }
          </div>
          <label class="relative block">
            <span class="sr-only">{{ 'reviewModal.searchLabel' | translate }}</span>
            <svg lucideSearch [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              class="input-field pl-10"
              [placeholder]="'reviewModal.searchPlaceholder' | translate"
              [ngModel]="query()"
              (ngModelChange)="onQuery($event)"
              autocomplete="off"
              autofocus
            />
          </label>
          @if (searching()) {
            <p class="px-1 text-sm text-muted">{{ 'common.searching' | translate }}</p>
          } @else if (query().trim().length >= 2 && results().length === 0) {
            <p class="px-1 text-sm text-muted">{{ 'reviewModal.noResults' | translate }}</p>
          }
          @if (results().length) {
            <ul class="-mx-2 max-h-[46vh] overflow-y-auto">
              @for (item of results(); track item.externalKey ?? item.tmdbId ?? item.id) {
                <li>
                  <button type="button" class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-elevated focus-visible:bg-elevated" (click)="select(item)">
                    <app-poster class="aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-[3px]" [title]="item.title" [src]="item.posterApiLink" [mediaType]="item.mediaType" />
                    <span class="min-w-0">
                      <span class="block truncate text-[15px] font-semibold">{{ item.title }}</span>
                      <span class="block truncate text-[13px] text-muted">{{ meta(item) }}</span>
                    </span>
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      } @else {
        <form class="space-y-5" (ngSubmit)="submit()">
          <div class="flex items-center gap-3.5">
            <app-poster class="aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-[4px] shadow-poster" [title]="selected()!.title" [src]="selected()!.posterApiLink" [mediaType]="selected()!.mediaType" [year]="selected()!.year" />
            <div class="min-w-0">
              <p class="font-display text-2xl font-bold uppercase leading-none">{{ selected()!.title }}</p>
              <p class="mt-1 text-sm text-muted">{{ meta(selected()!) }}</p>
              @if (!locked()) {
                <button type="button" class="mt-1 text-[13px] font-semibold text-accent-ink hover:underline" (click)="selected.set(null)">
                  {{ 'reviewModal.changeTitle' | translate }}
                </button>
              }
            </div>
          </div>

          <div>
            <span class="field-label">{{ 'reviewModal.rating' | translate }}</span>
            <app-star-rating mode="input" [size]="32" [value]="rating()" (valueChange)="rating.set($event)" [label]="'reviewModal.rating' | translate" />
            <p class="field-hint">{{ 'reviewModal.ratingHint' | translate }}</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="field-label">{{ 'reviewModal.dateWatched' | translate }}</span>
              <input type="date" class="input-field" name="date" [(ngModel)]="dateWatched" [max]="today" />
            </label>
            <div class="flex flex-col justify-end gap-2 pb-1 text-sm">
              <label class="flex min-h-6 cursor-pointer items-center gap-2.5">
                <input type="checkbox" class="h-4 w-4" name="seenBefore" [(ngModel)]="seenBefore" />
                {{ 'reviewModal.seenBefore' | translate }}
              </label>
              <label class="flex min-h-6 cursor-pointer items-center gap-2.5">
                <input type="checkbox" class="h-4 w-4" name="spoiler" [(ngModel)]="spoiler" />
                {{ 'reviewModal.spoiler' | translate }}
              </label>
            </div>
          </div>

          <label class="block">
            <span class="field-label">{{ 'reviewModal.review' | translate }}</span>
            <textarea class="input-field min-h-32 resize-y" name="text" rows="5" maxlength="4000" [placeholder]="'reviewModal.reviewPlaceholder' | translate" [(ngModel)]="text"></textarea>
            <span class="field-hint block text-right tabular-nums">{{ text.length }} / 4000</span>
          </label>

          <button type="submit" class="btn-primary w-full" [disabled]="submitting() || !rating()">
            {{ (submitting() ? 'reviewModal.submitting' : 'reviewModal.submit') | translate }}
          </button>
        </form>
      }
    </app-modal>
  `,
})
export class WriteReviewModalComponent {
  readonly open = input(false);
  /** Pre-fill with a title (from its detail page); the title cannot be changed then. */
  readonly media = input<MediaItem | null>(null);
  readonly closed = output<void>();
  readonly submitted = output<void>();

  private readonly mediaService = inject(MediaService);
  private readonly reviewService = inject(ReviewService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);

  readonly types = TYPES;
  readonly typeKeys = MEDIA_TYPE_KEYS;
  readonly today = new Date().toISOString().slice(0, 10);

  readonly searchType = signal<MediaType>('FILM');
  readonly query = signal('');
  readonly results = signal<MediaItem[]>([]);
  readonly searching = signal(false);
  readonly selected = signal<MediaItem | null>(null);
  readonly locked = signal(false);
  readonly rating = signal(0);
  readonly submitting = signal(false);

  dateWatched = this.today;
  seenBefore = false;
  spoiler = false;
  text = '';

  private readonly search$ = new Subject<{ type: MediaType; q: string }>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(250),
        distinctUntilChanged((a, b) => a.type === b.type && a.q === b.q),
        switchMap(({ type, q }) => {
          if (q.length < 2) return of([] as MediaItem[]);
          this.searching.set(true);
          return this.mediaService.search(type, q).pipe(catchError(() => of([] as MediaItem[])));
        }),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((items) => {
        this.results.set(items.slice(0, 20));
        this.searching.set(false);
      });

    effect(() => {
      if (!this.open()) return;
      const media = this.media();
      this.selected.set(media);
      this.locked.set(!!media);
      if (media?.mediaType && TYPES.includes(media.mediaType)) this.searchType.set(media.mediaType);
    });
  }

  meta(item: MediaItem): string {
    return [item.year, item.creator].filter(Boolean).join(', ');
  }

  setType(type: MediaType): void {
    this.searchType.set(type);
    this.search$.next({ type, q: this.query().trim() });
  }

  onQuery(q: string): void {
    this.query.set(q);
    this.search$.next({ type: this.searchType(), q: q.trim() });
  }

  select(item: MediaItem): void {
    this.selected.set(item);
  }

  close(): void {
    this.closed.emit();
    this.reset();
  }

  submit(): void {
    const media = this.selected();
    if (!media || (!media.tmdbId && !media.externalKey) || !this.rating() || this.submitting()) return;
    this.submitting.set(true);
    this.reviewService
      .create({
        tmdbId: media.tmdbId,
        externalKey: media.externalKey,
        mediaType: media.mediaType,
        rating: this.rating(),
        text: this.text.trim() || undefined,
        dateWatched: this.dateWatched || undefined,
        seenBefore: this.seenBefore,
        spoiler: this.spoiler,
      })
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.translate('reviewModal.published', { title: media.title }));
          this.submitting.set(false);
          this.submitted.emit();
          this.close();
        },
        error: (err) => {
          this.toast.error(errorMessage(err, this.i18n.translate('reviewModal.failed')));
          this.submitting.set(false);
        },
      });
  }

  private reset(): void {
    this.selected.set(null);
    this.locked.set(false);
    this.rating.set(0);
    this.query.set('');
    this.results.set([]);
    this.text = '';
    this.dateWatched = this.today;
    this.seenBefore = false;
    this.spoiler = false;
  }
}
