/**
 * Digits only, always in the 11-digit `7XXXXXXXXXX` shape, capped at 11.
 *
 * Callers may type the number any of the three ways people actually write it:
 * `+7 900…`, `8 900…`, or just `900…`. Russian area and mobile codes never
 * begin with 7 or 8 (8 is the trunk prefix), so a leading digit outside those
 * two can only be the start of a national number missing its country code —
 * previously that input produced nonsense like `+9 (001) 234-56-7` and left
 * the field silently invalid.
 */
export function normalizeDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  let raw = digits;
  if (raw[0] === "8") raw = `7${raw.slice(1)}`;
  else if (raw[0] !== "7") raw = `7${raw}`;

  return raw.slice(0, 11);
}

/** Formats as the user types: +7 (XXX) XXX-XX-XX */
export function formatPhone(value: string): string {
  const raw = normalizeDigits(value);
  if (raw.length === 0) return "";
  if (raw.length === 1) return `+${raw}`;
  if (raw.length <= 4) return `+${raw.slice(0, 1)} (${raw.slice(1)}`;
  if (raw.length <= 7) return `+${raw.slice(0, 1)} (${raw.slice(1, 4)}) ${raw.slice(4)}`;
  if (raw.length <= 9)
    return `+${raw.slice(0, 1)} (${raw.slice(1, 4)}) ${raw.slice(4, 7)}-${raw.slice(7)}`;
  return `+${raw.slice(0, 1)} (${raw.slice(1, 4)}) ${raw.slice(4, 7)}-${raw.slice(7, 9)}-${raw.slice(9)}`;
}

export function isCompletePhone(value: string): boolean {
  return normalizeDigits(value).length === 11;
}

/** The wire format the backend expects. */
export function toBackendPhone(value: string): string {
  return "+7" + normalizeDigits(value).slice(1);
}
