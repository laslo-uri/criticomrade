import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

/** Moves focus to #main. Handled in code because "#main" resolves against <base href="/"> and would leave the page. */
@Component({
  selector: 'app-skip-link',
  imports: [TranslatePipe],
  template: `<a href="#main" class="skip-link" (click)="skip($event)">{{ 'common.skipToContent' | translate }}</a>`,
})
export class SkipLinkComponent {
  skip(event: Event): void {
    event.preventDefault();
    const target = document.getElementById('main');
    target?.focus();
    target?.scrollIntoView();
  }
}
