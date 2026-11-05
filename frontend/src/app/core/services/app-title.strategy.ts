import { Injectable, effect, inject, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslationService } from './translation.service';

/** Route titles are i18n keys. A title with spaces is used as written. Pages that set their own title have no route title. */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(TranslationService);
  private current: string | null = null;

  constructor() {
    super();
    effect(() => {
      this.i18n.locale();
      untracked(() => this.apply());
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.current = this.buildTitle(snapshot) ?? null;
    this.apply();
  }

  private apply(): void {
    if (!this.current) return;
    this.title.setTitle(this.current.includes(' ') ? this.current : `${this.i18n.translate(this.current)} · CritiComrade`);
  }
}
