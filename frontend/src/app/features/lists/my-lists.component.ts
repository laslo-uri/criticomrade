import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideLibrary, LucideLock, LucidePlus } from '@lucide/angular';
import { ListService } from '../../core/services/list.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { MovieList } from '../../core/models/list.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TimeAgoPipe } from '../../core/pipes/time-ago.pipe';
import { errorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-my-lists',
  imports: [RouterLink, FormsModule, TranslatePipe, TimeAgoPipe, LucideLibrary, LucidePlus, LucideLock, EmptyStateComponent, ModalComponent, PosterComponent],
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ 'lists.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'lists.subtitle' | translate }}</p>
      </div>
      <button type="button" class="btn-primary" (click)="createOpen.set(true)">
        <svg lucidePlus [size]="17" /> {{ 'lists.newList' | translate }}
      </button>
    </header>

    @if (loading()) {
      <div class="grid gap-5 sm:grid-cols-2">
        @for (i of [1, 2]; track i) { <div class="skeleton h-48 w-full rounded-panel"></div> }
      </div>
    } @else if (lists().length === 0) {
      <app-empty-state [message]="'lists.emptyMessage' | translate" [hint]="'lists.emptyHint' | translate">
        <svg emptyIcon lucideLibrary [size]="26" />
        <button type="button" class="btn-primary" (click)="createOpen.set(true)">{{ 'lists.newList' | translate }}</button>
      </app-empty-state>
    } @else {
      <div class="grid gap-5 sm:grid-cols-2">
        @for (list of lists(); track list.id) {
          <a [routerLink]="['/lists', list.id]" class="group panel block overflow-hidden transition hover:border-text/30">
            <div class="relative h-40 overflow-hidden bg-elevated">
              @for (m of (list.movies ?? []).slice(0, 4); track m.id ?? $index; let i = $index) {
                <app-poster
                  class="absolute top-4 aspect-[2/3] w-[5.5rem] overflow-hidden rounded-[3px] shadow-lift transition duration-300 group-hover:-translate-y-1"
                  [style.left.px]="16 + i * 58"
                  [style.z-index]="4 - i"
                  [style.rotate.deg]="(i - 1.5) * 3"
                  [title]="m.title"
                  [src]="m.posterApiLink"
                  [mediaType]="m.mediaType"
                />
              } @empty {
                <p class="flex h-full items-center justify-center text-sm text-muted">{{ 'lists.noItemsYet' | translate }}</p>
              }
            </div>
            <div class="p-4">
              <h2 class="flex items-center gap-2 font-display text-2xl font-bold uppercase leading-none">
                <span class="truncate">{{ list.name }}</span>
                @if (list.isPrivateList) { <svg lucideLock [size]="15" class="shrink-0 text-muted" [attr.aria-label]="'lists.privateBadge' | translate" /> }
              </h2>
              <p class="mt-1.5 text-sm text-muted">
                {{ 'lists.itemCount' | translate: { count: list.numberOfElements ?? list.movies?.length ?? 0 } }}@if (list.lastModificationDate) {, {{ 'lists.updated' | translate: { when: (list.lastModificationDate | timeAgo) } }}}
              </p>
            </div>
          </a>
        }
      </div>
    }

    <app-modal [open]="createOpen()" [title]="'lists.newList' | translate" panelClass="sm:max-w-md" (closed)="createOpen.set(false)">
      <form class="space-y-4" (ngSubmit)="createList()">
        <label class="block">
          <span class="field-label">{{ 'lists.nameLabel' | translate }}</span>
          <input type="text" class="input-field" [placeholder]="'lists.namePlaceholder' | translate" [(ngModel)]="newListName" name="name" required maxlength="60" />
        </label>
        <label class="flex cursor-pointer items-start gap-2.5 text-sm">
          <input type="checkbox" class="mt-0.5 h-4 w-4" [(ngModel)]="newListPrivate" name="private" />
          <span>
            <span class="block font-semibold">{{ 'lists.privateList' | translate }}</span>
            <span class="block text-muted">{{ 'lists.privateHint' | translate }}</span>
          </span>
        </label>
        <button type="submit" class="btn-primary w-full" [disabled]="!newListName.trim() || saving()">{{ 'common.create' | translate }}</button>
      </form>
    </app-modal>
  `,
})
export class MyListsComponent implements OnInit {
  private readonly listService = inject(ListService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);

  readonly lists = signal<MovieList[]>([]);
  readonly loading = signal(true);
  readonly createOpen = signal(false);
  readonly saving = signal(false);
  newListName = '';
  newListPrivate = false;

  ngOnInit(): void {
    this.loadLists();
  }

  createList(): void {
    const name = this.newListName.trim();
    if (!name || this.saving()) return;
    this.saving.set(true);
    this.listService.create({ name, listType: 'CUSTOM', privateList: this.newListPrivate }).subscribe({
      next: () => {
        this.toast.success(this.i18n.translate('lists.created', { name }));
        this.newListName = '';
        this.newListPrivate = false;
        this.createOpen.set(false);
        this.saving.set(false);
        this.loadLists();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(errorMessage(err, this.i18n.translate('lists.createFailed')));
      },
    });
  }

  private loadLists(): void {
    this.listService.getMyLists('CUSTOM').subscribe({
      next: (lists) => {
        this.lists.set(lists);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
