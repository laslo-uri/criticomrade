import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteProgressComponent } from './shared/components/route-progress/route-progress.component';
import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouteProgressComponent, CookieConsentComponent],
  template: `
    <app-route-progress />
    <router-outlet />
    <app-cookie-consent />
  `,
})
export class AppComponent {}
