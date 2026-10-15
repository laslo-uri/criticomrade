import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/** Adds the bearer token to API calls and ends expired sessions cleanly. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  const isApi = req.url.startsWith(environment.apiUrl);
  const isAuthCall = /\/auth\/(login|register|forgot-password|reset-password)$/.test(req.url);

  const authReq =
    token && isApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && isApi && !isAuthCall && token) {
        auth.logout();
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url, expired: 1 },
        });
      }
      return throwError(() => error);
    })
  );
};
