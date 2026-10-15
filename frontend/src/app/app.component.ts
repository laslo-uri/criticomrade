import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteProgressComponent } from './shared/components/route-progress/route-progress.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouteProgressComponent],
  template: `
    <app-route-progress />
    <router-outlet />
  `,
})
export class AppComponent {}
