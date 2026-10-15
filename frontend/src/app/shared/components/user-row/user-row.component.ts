import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../../core/models/user.model';
import { AvatarComponent } from '../avatar/avatar.component';

/** One person in a list: avatar, name, handle, and an optional action slot on the right. */
@Component({
  selector: 'app-user-row',
  imports: [RouterLink, AvatarComponent],
  template: `
    <div class="flex items-center gap-3 py-3">
      <a [routerLink]="['/profile', user().username]" class="flex min-w-0 flex-1 items-center gap-3 rounded-lg">
        <app-avatar [name]="user().username" [url]="user().avatarUrl" [size]="44" />
        <span class="min-w-0">
          <span class="block truncate font-semibold text-text">{{ user().fullName || user().username }}</span>
          <span class="block truncate text-sm text-muted">&#64;{{ user().username }}</span>
          @if (detail()) {
            <span class="mt-0.5 line-clamp-2 block text-sm text-text/80">{{ detail() }}</span>
          }
        </span>
      </a>
      <ng-content />
    </div>
  `,
})
export class UserRowComponent {
  readonly user = input.required<User>();
  readonly detail = input<string>('');
}
