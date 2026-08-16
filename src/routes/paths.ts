/**
 * Single source of truth for the app's URLs.
 *
 * Imported both by the React router (browser) and by vite.config.ts (node),
 * so the dev-server fallback can never drift away from the real route table.
 * Keep this file free of browser- and React-only imports.
 */

export const PATHS = {
  preorder: "/preorder/:slug",
  orders: "/orders",
  paySuccess: "/pay/success",
  payFail: "/pay/fail",
} as const;

/** Django serves these URLs with a trailing slash, so links are built with one. */
export const preorderUrl = (slug: string) => `/preorder/${encodeURIComponent(slug)}/`;
export const ordersUrl = () => "/orders/";

/**
 * Matchers for the dev-server SPA fallback: every app URL must return index.html
 * instead of Vite's 404, otherwise a hard refresh on a deep link breaks.
 */
export const APP_ROUTE_PATTERNS: RegExp[] = Object.values(PATHS).map(
  (pattern) => new RegExp(`^${pattern.replace(/:[^/]+/g, "[^/]+")}/?$`)
);

/** `true` for a URL this SPA owns. Query string and hash are ignored. */
export function isAppRoute(url: string): boolean {
  const pathname = url.split(/[?#]/)[0];
  return APP_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}
