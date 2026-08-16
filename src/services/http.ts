import { csrfHeaders } from "./csrf";

/** A non-2xx response. `status` is what callers branch on, never the message. */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** The request never reached the server (offline, DNS, CORS, connection reset). */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super("Network request failed");
    this.name = "NetworkError";
    this.cause = cause;
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

function readServerMessage(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const { error, detail } = payload as { error?: unknown; detail?: unknown };
  if (typeof error === "string" && error.trim()) return error;
  if (typeof detail === "string" && detail.trim()) return detail;
  return undefined;
}

/**
 * The single entry point for backend calls.
 *
 * In production the SPA is embedded in a Django template on the same origin,
 * so `same-origin` credentials carry the session cookie set by Django. In dev
 * the Vite proxy injects the cookie from the env file instead (see .env.example).
 */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "same-origin",
      ...init,
      headers: { ...csrfHeaders(), ...init.headers },
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new NetworkError(err);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(res.status, readServerMessage(payload) ?? `HTTP ${res.status}`, payload);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type ErrorKind = "auth" | "notFound" | "server" | "network" | "unknown";

export function classifyError(err: unknown): ErrorKind {
  if (err instanceof NetworkError) return "network";
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return "auth";
    if (err.status === 404) return "notFound";
    if (err.status >= 500) return "server";
  }
  return "unknown";
}

const DEFAULT_MESSAGES: Record<ErrorKind, string> = {
  auth: "Чтобы продолжить, войдите в аккаунт.",
  notFound: "Мы не смогли найти эту страницу.",
  server: "Сервис временно недоступен. Мы уже знаем о проблеме — попробуйте через несколько минут.",
  network: "Нет связи с сервером. Проверьте интернет-соединение и попробуйте снова.",
  unknown: "Что-то пошло не так. Попробуйте ещё раз.",
};

/**
 * Turns any thrown value into copy a customer can act on. Raw statuses and
 * `err.message` never reach the screen — pass `overrides` for page-specific wording.
 */
export function errorMessage(
  err: unknown,
  overrides: Partial<Record<ErrorKind, string>> = {}
): string {
  const kind = classifyError(err);
  return overrides[kind] ?? DEFAULT_MESSAGES[kind];
}
