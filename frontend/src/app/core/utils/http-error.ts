import { HttpErrorResponse } from '@angular/common/http';

/** Pulls a human-readable message out of an API error, or returns the fallback. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return fallback;
    const body = error.error as { message?: unknown; error?: unknown } | string | null;
    if (typeof body === 'string' && body.length < 200 && !body.trim().startsWith('<')) return body;
    if (body && typeof body === 'object' && typeof body.message === 'string' && body.message) return body.message;
  }
  return fallback;
}
