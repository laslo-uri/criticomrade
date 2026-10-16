import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { storage } from '../utils/storage';

const OVERRIDE_KEY = 'criticomrade_demo';

/**
 * Decides, once per page load, whether the app talks to the real Spring Boot API
 * or to the in-browser demo backend.
 *
 * Order of precedence:
 *  1. `?demo=1` / `?demo=0` in the URL (remembered for this browser)
 *  2. a remembered choice from (1)
 *  3. `environment.demoMode` ('on' | 'off')
 *  4. 'auto': probe `${apiUrl}/stats`; anything that is not a JSON answer means "no backend"
 */
@Injectable({ providedIn: 'root' })
export class RuntimeService {
  readonly apiUrl = environment.apiUrl;
  readonly demo = signal(false);
  /** True when demo mode was picked automatically because no API answered. */
  readonly demoFallback = signal(false);
  /** True when the API that answered is the Vercel demo API (in-memory, seeded). */
  readonly serverDemo = signal(false);
  /** Any kind of demo: in this browser, or the hosted demo API. Drives the demo sign-in hints. */
  readonly anyDemo = computed(() => this.demo() || this.serverDemo());

  async init(): Promise<void> {
    const param = new URLSearchParams(window.location.search).get('demo');
    if (param === '1' || param === 'on' || param === 'true') {
      storage.set(OVERRIDE_KEY, 'on');
    } else if (param === '0' || param === 'off' || param === 'false') {
      storage.set(OVERRIDE_KEY, 'off');
    }

    const override = storage.get(OVERRIDE_KEY);
    if (override === 'on') return this.demo.set(true);
    if (environment.demoMode === 'on') return this.demo.set(true);

    const reachable = await this.probe();
    // "off" never falls back to the in-browser demo, but still learns whether the API is the hosted demo.
    if (override === 'off' || environment.demoMode === 'off') return this.demo.set(false);
    this.demo.set(!reachable);
    this.demoFallback.set(!reachable);
  }

  private async probe(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${this.apiUrl}/stats`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      // A Spring answer (even 401/403) is JSON. A static host answers with HTML or a 404 page.
      const type = res.headers.get('content-type') ?? '';
      const ok = type.includes('json') && res.status !== 404;
      if (ok && res.ok) {
        const body = await res.json().catch(() => null);
        this.serverDemo.set(!!body && typeof body === 'object' && body.demo === true);
      }
      return ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
