export const environment = {
  production: true,
  /**
   * Same-origin API path. On Vercel, point it at your backend with a rewrite in vercel.json
   * (see README). With no backend behind it, the app runs on the in-browser demo backend.
   */
  apiUrl: '/api',
  demoMode: 'auto' as 'auto' | 'on' | 'off',
  /**
   * Analytics IDs, filled at build time by `scripts/analytics-env.mjs` from the GTM_ID / GA_ID
   * env vars (Vercel). Empty = no analytics, no cookie banner.
   */
  gtmId: '',
  gaId: '',
};
