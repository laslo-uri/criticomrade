import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

@Component({
  selector: 'app-route-progress',
  standalone: true,
  template: `
    <div class="route-progress-track" [class.route-progress-visible]="visible()">
      <div class="route-progress-bar" [style.transform]="'scaleX(' + progress() / 100 + ')'"></div>
    </div>
  `,
  styles: `
    .route-progress-track {
      pointer-events: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      height: 2px;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .route-progress-visible {
      opacity: 1;
    }

    .route-progress-bar {
      height: 100%;
      width: 100%;
      transform-origin: left center;
      transform: scaleX(0);
      background: linear-gradient(
        90deg,
        rgb(var(--c-accent)),
        rgb(var(--c-brass))
      );
      transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: 0 0 12px rgb(var(--c-accent) / 0.45);
    }
  `,
})
export class RouteProgressComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = signal(false);
  readonly progress = signal(0);

  private completeTimer?: ReturnType<typeof setTimeout>;
  private tickTimer?: ReturnType<typeof setInterval>;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.start();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.finish();
      }
    });
  }

  private start(): void {
    clearTimeout(this.completeTimer);
    clearInterval(this.tickTimer);
    this.visible.set(true);
    this.progress.set(12);

    this.tickTimer = setInterval(() => {
      this.progress.update((p) => (p >= 88 ? p : p + Math.random() * 8));
    }, 280);
  }

  private finish(): void {
    clearInterval(this.tickTimer);
    this.progress.set(100);

    this.completeTimer = setTimeout(() => {
      this.visible.set(false);
      this.progress.set(0);
    }, 380);
  }
}
