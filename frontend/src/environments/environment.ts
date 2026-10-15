export const environment = {
  production: false,
  /** Base URL of the Spring Boot API. */
  apiUrl: 'http://localhost:8080/api',
  /**
   * 'auto' — probe the API on startup and fall back to the in-browser demo backend if it does not answer.
   * 'on'   — always use the demo backend.
   * 'off'  — never use the demo backend.
   */
  demoMode: 'auto' as 'auto' | 'on' | 'off',
};
