import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
        canActivate: [authGuard],
      },
      {
        path: 'explore',
        loadComponent: () =>
          import('./features/explore/explore.component').then((m) => m.ExploreComponent),
      },
      {
        path: 'movies/:id',
        loadComponent: () =>
          import('./features/movie/movie-detail.component').then(
            (m) => m.MovieDetailComponent
          ),
      },
      {
        path: 'profile/:username',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'diary',
        loadComponent: () =>
          import('./features/lists/diary.component').then((m) => m.DiaryComponent),
        canActivate: [authGuard],
      },
      {
        path: 'watchlist',
        loadComponent: () =>
          import('./features/lists/watchlist.component').then((m) => m.WatchlistComponent),
        canActivate: [authGuard],
      },
      {
        path: 'lists',
        loadComponent: () =>
          import('./features/lists/my-lists.component').then((m) => m.MyListsComponent),
        canActivate: [authGuard],
      },
      {
        path: 'lists/:id',
        loadComponent: () =>
          import('./features/lists/list-detail.component').then(
            (m) => m.ListDetailComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(
            (m) => m.NotificationsComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'recommendations',
        loadComponent: () =>
          import('./features/recommendations/recommendations.component').then(
            (m) => m.RecommendationsComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        canActivate: [authGuard],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
