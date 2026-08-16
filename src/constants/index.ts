/**
 * Driven by the build mode, never edited by hand — a stale manual flag here
 * silently points production at the dev proxy (and vice versa).
 */
export const IS_PRODUCTION = import.meta.env.PROD;

export const BACKEND_URL = "https://alterlit.ru";

/**
 * In production the SPA is served by Django from BACKEND_URL, so these stay
 * same-origin and the session cookie is sent automatically. In dev the paths
 * stay relative and go through the Vite proxy, which attaches the cookie
 * from the env file.
 */
function apiUrl(path: string): string {
  if (IS_PRODUCTION) return `${BACKEND_URL}${path}`;
  return path;
}

export const CDEK_ENDPOINTS = {
  cities: apiUrl("/api/v1/cdek/cities/"),
  deliveryPoints: apiUrl("/api/v1/cdek/offices/"),
  submitOrder: apiUrl("/api/v1/cdek/order/"),
  submitGuestOrder: apiUrl("/api/v1/cdek/order/guest/"),
  guestPay: apiUrl("/api/v1/pay/guest/"),
  bookInfo: (slug: string) => apiUrl(`/api/v1/preorder/info/${slug}/`),
  verifySession: apiUrl("/api/v1/users/session/verify/"),
} as const;

export const POPULAR_CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Владивосток",
  "Волгоград",
  "Екатеринбург",
  "Казань",
  "Краснодар",
  "Красноярск",
  "Новосибирск",
  "Ростов-на-Дону",
  "Самара",
  "Саратов",
  "Тюмень",
  "Уфа",
  "Хабаровск",
  "Челябинск",
];
