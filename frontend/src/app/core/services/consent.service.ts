import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { storage } from '../utils/storage';
import {
  AnalyticsIds,
  ConsentChoice,
  applyConsent,
  ensureConsentDefaults,
  gaScriptUrl,
  getAnalyticsIds,
  gtmScriptUrl,
  hasAnalyticsIds,
  primeAnalytics,
  readStoredConsent,
  shouldLoadAnalytics,
  storeConsent,
} from '../analytics/consent';

/**
 * Cookie consent state + analytics loader (Google Consent Mode v2).
 *
 * With no `gtmId` / `gaId` in the environment the service is disabled: no banner, no footer link,
 * no script. Consent Mode defaults (all denied) are pushed before any tag can load; GTM / gtag.js
 * load only after an explicit accept, as async script tags appended after the app has rendered.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  readonly ids: AnalyticsIds = getAnalyticsIds({ gtmId: environment.gtmId, gaId: environment.gaId });
  /** True when at least one analytics ID is configured. */
  readonly enabled = hasAnalyticsIds(this.ids);

  readonly choice = signal<ConsentChoice | null>(null);
  readonly open = signal(false);
  /** True when the banner was reopened from the footer, so it should take focus. */
  readonly reopened = signal(false);
  readonly canDismiss = computed(() => this.choice() !== null);

  private initialized = false;
  private scriptsLoaded = false;

  /** Called once after the root component has rendered. */
  init(): void {
    if (this.initialized || !this.enabled) return;
    this.initialized = true;
    ensureConsentDefaults(window);
    const stored = readStoredConsent(storage);
    if (stored) applyConsent(window, stored);
    this.choice.set(stored);
    this.open.set(!stored);
    this.loadScriptsIfAllowed();
  }

  decide(choice: ConsentChoice): void {
    if (!this.enabled) return;
    storeConsent(storage, choice);
    applyConsent(window, choice);
    this.choice.set(choice);
    this.open.set(false);
    this.reopened.set(false);
    this.loadScriptsIfAllowed();
  }

  /** Reopens the banner (footer link) so the choice can be changed. */
  openSettings(): void {
    if (!this.enabled) return;
    this.reopened.set(true);
    this.open.set(true);
  }

  /** Escape: closes the banner only when a choice already exists. */
  dismiss(): void {
    if (this.canDismiss()) {
      this.open.set(false);
      this.reopened.set(false);
    }
  }

  private loadScriptsIfAllowed(): void {
    if (this.scriptsLoaded || !shouldLoadAnalytics(this.choice(), this.ids)) return;
    this.scriptsLoaded = true;
    primeAnalytics(window, this.ids);
    if (this.ids.gtmId) this.appendScript(gtmScriptUrl(this.ids.gtmId));
    if (this.ids.gaId) this.appendScript(gaScriptUrl(this.ids.gaId));
  }

  private appendScript(src: string): void {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }
}
