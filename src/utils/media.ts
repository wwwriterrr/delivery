import { IS_PRODUCTION, BACKEND_URL } from "../constants";

/**
 * Backend image paths come back relative (`/media/...`). In production the SPA
 * is served from the same origin, so they resolve as-is; in dev they need the
 * backend host prefixed.
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return "";
  if (IS_PRODUCTION || url.startsWith("http")) return url;
  return BACKEND_URL + url;
}
