/** Digits only, normalised so a leading 8 becomes 7, capped at 11 digits. */
export function normalizeDigits(value: string): string {
  let raw = value.replace(/\D/g, "");
  if (raw.startsWith("8")) raw = "7" + raw.slice(1);
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
