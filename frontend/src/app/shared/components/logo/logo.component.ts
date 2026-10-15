import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type LogoVariant = 'nav' | 'hero' | 'mark';

/**
 * Brand mark: two speech bubbles (the critic in banner red, the comrade in brass) with a
 * five-pointed star in the front bubble, plus the CRITI/COMRADE wordmark.
 */
@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="link()"
      class="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-offset-4"
      aria-label="CritiComrade home"
    >
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        class="shrink-0 transition-transform duration-300 group-hover:-rotate-6"
        [class]="variant() === 'hero' ? 'h-12 w-12' : 'h-9 w-9'"
      >
        <path d="M24 16h32a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6h-2v10l-11-10H24a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6z" fill="#F2A93B" />
        <path d="M8 4h32a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H22L11 48V38H8a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6z" fill="#C8262A" />
        <polygon
          points="24,9 27.06,17.29 35.89,17.64 28.95,23.11 31.35,31.61 24,26.7 16.65,31.61 19.05,23.11 12.11,17.64 20.94,17.29"
          fill="#FBF5EE"
        />
      </svg>
      @if (variant() !== 'mark') {
        <span
          class="font-display font-extrabold uppercase leading-none tracking-[0.02em]"
          [class]="variant() === 'hero' ? 'text-[2.1rem]' : 'text-[1.45rem] max-[359px]:hidden'"
        >
          <span class="text-text">Criti</span><span class="text-accent-ink">comrade</span>
        </span>
      }
    </a>
  `,
})
export class LogoComponent {
  readonly variant = input<LogoVariant>('nav');
  readonly link = input<string>('/');
}
