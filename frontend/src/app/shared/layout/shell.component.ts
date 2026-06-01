import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { BottomNavComponent } from '../components/bottom-nav/bottom-nav.component';
import { ToastComponent } from '../components/toast/toast.component';
import { shellRouteAnimations } from '../animations/route.animations';

@Component({
    selector: 'app-shell',
    imports: [
        RouterOutlet,
        NavbarComponent,
        SidebarComponent,
        BottomNavComponent,
        ToastComponent,
    ],
    animations: [shellRouteAnimations],
    template: `
    <div class="flex min-h-screen flex-col">
      <app-navbar />
      <div class="grid flex-1 md:grid-cols-[15rem_1fr]">
        <app-sidebar />
        <main class="overflow-y-auto pb-20 md:pb-8">
          <div class="shell-route-host mx-auto max-w-4xl px-4 py-8 lg:px-8">
            <div [@shellRouteAnimations]="routeKey(outlet)">
              <router-outlet #outlet="outlet" />
            </div>
          </div>
        </main>
      </div>
      <app-bottom-nav />
      <app-toast />
    </div>
  `
})
export class ShellComponent {
  private readonly router = inject(Router);

  routeKey(outlet: RouterOutlet): string {
    if (!outlet.isActivated) {
      return this.router.url;
    }
    const child = outlet.activatedRoute.snapshot;
    return child.url.map((s) => s.path).join('/') || child.routeConfig?.path || 'home';
  }
}
