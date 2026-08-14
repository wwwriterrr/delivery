import { CDEK_ENDPOINTS } from "../constants";
import { csrfHeaders } from "./csrf";

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
}

export interface GuestOrder extends Order {
  uuid: string;
}

export const fetchGuestOrder = async (signal: AbortSignal, params: URLSearchParams): Promise<GuestOrder> => {
  const url = `${CDEK_ENDPOINTS.submitGuestOrder}?${params.toString()}`;
  const res = await fetch(url, { signal, headers: csrfHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data?.error) throw new Error(data.error);
    throw new Error(`Guest order request failed: ${res.status}`);
  }
  return res.json();
};

export const fetchOrders = async (signal: AbortSignal): Promise<Order[]> => {
  const res = await fetch(CDEK_ENDPOINTS.submitOrder, { signal, headers: csrfHeaders() });
  if (!res.ok) throw new Error(`Orders request failed: ${res.status}`);
  const data = await res.json();
  return data.orders ?? [];
};

export const fetchCities = async (query: string): Promise<City[]> => {
  const url = `${CDEK_ENDPOINTS.cities}?query=${encodeURIComponent(query)}`;

  const res = await fetch(url.toString(), { headers: csrfHeaders() });

  if (!res.ok) throw new Error(`Cities request failed: ${res.status}`);
  const data = await res.json();
  return data.items ?? data;
};

export const fetchDeliveryPoints = async (
  cityUuid: string
): Promise<DeliveryPoint[]> => {
  const url = `${CDEK_ENDPOINTS.deliveryPoints}?city_uuid=${encodeURIComponent(cityUuid)}`;

  const res = await fetch(url.toString(), { headers: csrfHeaders() });

  if (!res.ok) throw new Error(`Delivery points request failed: ${res.status}`);
  const data = await res.json();
  return data.items ?? data;
};
