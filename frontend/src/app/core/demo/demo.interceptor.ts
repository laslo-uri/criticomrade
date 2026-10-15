import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, delay, of, throwError, mergeMap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RuntimeService } from '../services/runtime.service';
import { NotificationService } from '../services/notification.service';
import { DemoBackend, DemoHttpError } from './demo-backend';

/** Holds the single demo backend instance for the page. */
@Injectable({ providedIn: 'root' })
export class DemoService {
  private backend?: DemoBackend;
  private readonly notifications = inject(NotificationService);

  get instance(): DemoBackend {
    if (!this.backend) {
      this.backend = new DemoBackend();
      this.backend.onActivity = () => this.notifications.refreshUnread();
    }
    return this.backend;
  }

  reset(): void {
    this.instance.reset();
  }
}

/** Answers API calls from the in-browser demo backend when demo mode is on. */
export const demoInterceptor: HttpInterceptorFn = (req, next) => {
  const runtime = inject(RuntimeService);
  const demo = inject(DemoService);
  const base = environment.apiUrl;

  if (!runtime.demo() || !req.url.startsWith(base)) {
    return next(req);
  }

  const url = new URL(req.urlWithParams.slice(base.length) || '/', 'http://demo.local');
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null;
  // A short, slightly varied latency keeps loading states honest without feeling slow.
  const latency = req.method === 'GET' ? 120 + Math.random() * 180 : 220 + Math.random() * 200;

  return defer((): Observable<HttpResponse<unknown>> => {
    try {
      const result = demo.instance.handle({
        method: req.method,
        path: url.pathname,
        params: url.searchParams,
        body: req.body,
        token,
      });
      // Clone so callers can never mutate demo state by reference.
      const body = result.body === null || result.body === undefined ? null : structuredClone(result.body);
      return of(new HttpResponse({ status: result.status, body, url: req.url })).pipe(delay(latency));
    } catch (e) {
      const status = e instanceof DemoHttpError ? e.status : 500;
      const message = e instanceof DemoHttpError ? e.message : 'Something went wrong in the demo backend.';
      if (!(e instanceof DemoHttpError)) console.error(e);
      return timer(latency).pipe(
        mergeMap(() =>
          throwError(() => new HttpErrorResponse({ status, statusText: message, error: { message }, url: req.url }))
        )
      );
    }
  });
};
