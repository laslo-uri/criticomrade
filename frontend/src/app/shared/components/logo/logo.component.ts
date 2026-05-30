import { Component, input, signal } from '@angular/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AboutModalComponent } from '../about-modal/about-modal.component';

export type LogoVariant = 'nav' | 'hero';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [TranslatePipe, AboutModalComponent],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.css',
})
export class LogoComponent {
  readonly variant = input<LogoVariant>('hero');
  readonly aboutOpen = signal(false);

  openAbout(): void {
    this.aboutOpen.set(true);
  }
}
