import { inject } from '@angular/core';
import { CanMatchFn, Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

const signedOut: CanMatchFn = () => !inject(AuthService).isLoggedIn();

export const routes: Routes = [
  // Public landing page for visitors; signed-in people get their home feed at the same URL.
  {
    path: '',
    pathMatch: 'full',
    canMatch: [signedOut],
    title: 'CritiComrade — log it, rate it, argue it out',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        title: 'auth.login.title',
        loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        title: 'auth.register.title',
        loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        title: 'auth.forgotPassword.title',
        loadComponent: () =>
          import('./features/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        title: 'auth.resetPassword.title',
        loadComponent: () =>
          import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard],
        title: 'nav.home',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'explore',
        title: 'nav.explore',
        loadComponent: () => import('./features/explore/explore.component').then((m) => m.ExploreComponent),
      },
      {
        path: 'people',
        title: 'nav.people',
        loadComponent: () => import('./features/people/people.component').then((m) => m.PeopleComponent),
      },
      {
        path: 'movies/tmdb/:tmdbId',
        loadComponent: () =>
          import('./features/media-detail/media-detail.component').then((m) => m.MediaDetailComponent),
      },
      {
        path: 'movies/:id',
        loadComponent: () =>
          import('./features/media-detail/media-detail.component').then((m) => m.MediaDetailComponent),
      },
      {
        path: 'media/resolve',
        loadComponent: () =>
          import('./features/media-detail/media-detail.component').then((m) => m.MediaDetailComponent),
      },
      {
        path: 'media/:id',
        loadComponent: () =>
          import('./features/media-detail/media-detail.component').then((m) => m.MediaDetailComponent),
      },
      {
        path: 'stats',
        title: 'nav.stats',
        loadComponent: () => import('./features/stats/stats.component').then((m) => m.StatsComponent),
      },
      {
        path: 'profile/:username',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'diary',
        canActivate: [authGuard],
        title: 'nav.diary',
        loadComponent: () => import('./features/lists/diary.component').then((m) => m.DiaryComponent),
      },
      {
        path: 'watchlist',
        canActivate: [authGuard],
        title: 'nav.watchlist',
        loadComponent: () => import('./features/lists/watchlist.component').then((m) => m.WatchlistComponent),
      },
      {
        path: 'lists',
        canActivate: [authGuard],
        title: 'nav.lists',
        loadComponent: () => import('./features/lists/my-lists.component').then((m) => m.MyListsComponent),
      },
      {
        path: 'lists/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/lists/list-detail.component').then((m) => m.ListDetailComponent),
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        title: 'nav.notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'recommendations',
        canActivate: [authGuard],
        title: 'nav.recommendations',
        loadComponent: () =>
          import('./features/recommendations/recommendations.component').then((m) => m.RecommendationsComponent),
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        title: 'nav.settings',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: '**',
        title: 'notFound.title',
        loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
