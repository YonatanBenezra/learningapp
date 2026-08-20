export const config = {
  /**
   * API base URL. Use `/api` in local dev so auth cookies (path `/api`) are sent.
   * Direct backend URLs (e.g. http://localhost:4000) break cookie auth unless
   * the backend sets AUTH_COOKIE_PATH=/.
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? '/api',
};
