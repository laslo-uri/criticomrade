import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { rootRouteAnimations } from './shared/animations/route.animations';
import { RouteProgressComponent } from './shared/components/route-progress/route-progress.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouteProgressComponent],
    animations: [rootRouteAnimations],
    template: `
    <app-route-progress />
    <div class="root-route-host" [@rootRouteAnimations]="routeKey(outlet)">
      <router-outlet #outlet="outlet" />
    </div>
  `
})
export class AppComponent {
  private readonly router = inject(Router);

  routeKey(outlet: RouterOutlet): string {
    return outlet.isActivated
      ? outlet.activatedRoute.snapshot.url.map((s) => s.path).join('/') ||
          this.router.url
      : this.router.url;
  }
}
