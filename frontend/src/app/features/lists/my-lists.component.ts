import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideList, LucidePlus } from '@lucide/angular';
import { ListService } from '../../core/services/list.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { MovieList } from '../../core/models/list.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-my-lists',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslatePipe, LucideList, LucidePlus, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">{{ 'lists.title' | translate }}</h1>
          <p class="text-muted">{{ 'lists.subtitle' | translate }}</p>
        </div>
        <button type="button" class="btn-primary" (click)="showCreate.set(true)">
          <svg lucidePlus [size]="16" />
          {{ 'lists.newList' | translate }}
        </button>
      </div>

      @if (showCreate()) {
        <form class="card space-y-3" (submit)="createList($event)">
          <input
            type="text"
            class="input-field"
            [placeholder]="'lists.namePlaceholder' | translate"
            [(ngModel)]="newListName"
            name="name"
            required
          />
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" [(ngModel)]="newListPrivate" name="private" />
            {{ 'lists.privateList' | translate }}
          </label>
          <div class="flex gap-2">
            <button type="submit" class="btn-primary">{{ 'common.create' | translate }}</button>
            <button type="button" class="btn-secondary" (click)="showCreate.set(false)">{{ 'common.cancel' | translate }}</button>
          </div>
        </form>
      }

      @if (lists().length === 0 && !loading()) {
        <app-empty-state
          [message]="'lists.emptyMessage' | translate"
          [hint]="'lists.emptyHint' | translate"
        >
          <svg emptyIcon lucideList [size]="48" class="mb-4 text-muted" />
        </app-empty-state>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          @for (list of lists(); track list.id) {
            <a
              [routerLink]="['/lists', list.id]"
              class="card transition hover:border-accent/40"
            >
              <h3 class="font-medium">{{ list.name }}</h3>
              <p class="text-sm text-muted">
                {{ 'lists.filmCount' | translate: { count: list.numberOfElements ?? 0 } }}
                @if (list.isPrivateList) {
                  · {{ 'lists.privateBadge' | translate }}
                }
              </p>
            </a>
          }
        </div>
      }
      @if (loading()) {
        <p class="text-center text-muted">{{ 'common.loading' | translate }}</p>
      }
    </div>
  `,
})
export class MyListsComponent {
  private readonly listService = inject(ListService);
  private readonly toast = inject(ToastService);
  private readonly translationService = inject(TranslationService);

  lists = signal<MovieList[]>([]);
  loading = signal(true);
  showCreate = signal(false);
  newListName = '';
  newListPrivate = false;

  ngOnInit(): void {
    this.loadLists();
  }

  createList(event: Event): void {
    event.preventDefault();
    if (!this.newListName.trim()) return;
    this.listService
      .create({
        name: this.newListName.trim(),
        listType: 'CUSTOM',
        privateList: this.newListPrivate,
      })
      .subscribe({
        next: () => {
          this.toast.success(this.translationService.translate('lists.created'));
          this.newListName = '';
          this.newListPrivate = false;
          this.showCreate.set(false);
          this.loadLists();
        },
        error: () => this.toast.error(this.translationService.translate('lists.createFailed')),
      });
  }

  private loadLists(): void {
    this.loading.set(true);
    this.listService.getMyLists('CUSTOM').subscribe({
      next: (lists) => {
        this.lists.set(lists);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
