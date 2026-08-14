export const IS_PRODUCTION = false;

export const BACKEND_URL = "https://alterlit.ru";

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
