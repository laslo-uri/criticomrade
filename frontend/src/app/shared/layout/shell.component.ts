import { Component, DestroyRef, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { BottomNavComponent } from '../components/bottom-nav/bottom-nav.component';
import { ToastComponent } from '../components/toast/toast.component';
import { DemoBannerComponent } from '../components/demo-banner/demo-banner.component';
import { WriteReviewModalComponent } from '../components/write-review-modal/write-review-modal.component';
import { FooterComponent } from '../components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    BottomNavComponent,
    ToastComponent,
    DemoBannerComponent,
    WriteReviewModalComponent,
    FooterComponent,
  ],
  template: `
    <a href="#main" class="skip-link">Skip to content</a>
    <app-demo-banner />
    <app-navbar />
    <div class="mx-auto grid max-w-page px-4 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-8 lg:gap-12 lg:px-6">
      <aside class="hidden md:block">
        <app-sidebar />
      </aside>
      <main id="main" class="min-w-0 pb-28 pt-6 md:pb-12 md:pt-8" tabindex="-1">
        <router-outlet />
        <app-footer class="mt-16 hidden md:block" />
      </main>
    </div>
    <app-bottom-nav />
    <app-toast />
    <app-write-review-modal
      [open]="ui.reviewOpen()"
      [media]="ui.reviewMedia()"
      (closed)="ui.closeReview()"
      (submitted)="ui.reviewPublished$.next()"
    />
  `,
})
export class ShellComponent {
  readonly ui = inject(UiService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  constructor() {
    // Keep the unread badge fresh: on sign-in and after every navigation.
    effect(() => {
      if (this.auth.isLoggedIn()) this.notifications.refreshUnread();
      else this.notifications.unread.set(0);
    });
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe(() => {
        if (this.auth.isLoggedIn()) this.notifications.refreshUnread();
      });
  }
}
