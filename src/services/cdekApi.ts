import { CDEK_ENDPOINTS } from "../constants";
import { apiFetch } from "./http";

export interface City {
  city_uuid: string;
  code: number;
  full_name: string;
  country_code: string;
}

export interface DeliveryPointPhone {
  number: string;
  additional: string;
}

export interface DeliveryPointWorkTime {
  day: number | null;
  time: string;
}

export interface DeliveryPointWorkTimeException {
  date_start: string;
  date_end: string;
  time_start: string;
  time_end: string;
  is_working: boolean;
}

export interface DeliveryPointLocation {
  country_code: string;
  region_code: number | null;
  region: string;
  city_code: number | null;
  city: string;
  fias_guid: string | null;
  postal_code: string;
  longitude: number | null;
  latitude: number | null;
  address: string;
  address_full: string;
  city_uuid: string | null;
}

export interface DeliveryPoint {
  code: string;
  uuid: string;
  /** "PVZ" | "POSTAMAT" — СДЭК may add more, so it stays a plain string. */
  type?: string;
  address_comment: string;
  nearest_station: string;
  nearest_metro_station: string;
  work_time: string;
  phones: DeliveryPointPhone[];
  email: string;
  note: string;
  owner_code: string;
  is_handout: boolean | null;
  is_reception: boolean | null;
  have_cashless: boolean | null;
  have_cash: boolean | null;
  allowed_cod: boolean | null;
  site: string;
  status: string;
  location: DeliveryPointLocation;
  distance: number | null;
  work_time_list: DeliveryPointWorkTime[];
  work_time_exception_list: DeliveryPointWorkTimeException[];
}

export interface Book {
  id: string | number;
  name: string;
  descr?: string;
  thumbnail?: string;
  price: number;
  author: string;
}

export interface Order {
  id: string | number;
  dt: number;
  book: Book;
  name?: string;
  phone?: string;
  email?: string;
  delivery_point?: string;
  delivery_address?: string;
  /** Not sent by the backend yet; the card renders a chip as soon as it is. */
  status?: string;
}

export interface GuestOrder extends Order {
  uuid: string;
}

export interface BookInfo {
  title: string;
  description: string;
  author: string;
  /** When present, the author's name becomes a link to their page. */
  author_url?: string;
  price: number;
  thumbnail?: string;
}

/** The list endpoints answer either with a bare array or `{ items: [...] }`. */
function toList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "object" && data !== null) {
    const { items } = data as { items?: unknown };
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

export const fetchBookInfo = (slug: string, signal: AbortSignal): Promise<BookInfo> =>
  apiFetch<BookInfo>(CDEK_ENDPOINTS.bookInfo(slug), { signal });

export interface Balance {
  lits: number;
  books: number;
}

/** Answers only for a valid session, so it doubles as the session check. */
export const fetchBalance = (signal: AbortSignal): Promise<Balance> =>
  apiFetch<Balance>(CDEK_ENDPOINTS.balance, { signal });

export const fetchGuestOrder = (signal: AbortSignal, params: URLSearchParams): Promise<GuestOrder> =>
  apiFetch<GuestOrder>(`${CDEK_ENDPOINTS.submitGuestOrder}?${params.toString()}`, { signal });

export const fetchOrders = async (signal: AbortSignal): Promise<Order[]> => {
  const data = await apiFetch<{ orders?: Order[] }>(CDEK_ENDPOINTS.submitOrder, { signal });
  return data.orders ?? [];
};

export const fetchCities = async (query: string, signal?: AbortSignal): Promise<City[]> => {
  const data = await apiFetch<unknown>(
    `${CDEK_ENDPOINTS.cities}?query=${encodeURIComponent(query)}`,
    { signal }
  );
  return toList<City>(data);
};

/** `cityCode` is the СДЭК city code — `City.code` from the cities endpoint. */
export const fetchDeliveryPoints = async (
  cityCode: string,
  signal?: AbortSignal
): Promise<DeliveryPoint[]> => {
  const data = await apiFetch<unknown>(
    `${CDEK_ENDPOINTS.deliveryPoints}?city_code=${encodeURIComponent(cityCode)}`,
    { signal }
  );
  return toList<DeliveryPoint>(data);
};
