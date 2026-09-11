/**
 * "Бука" — the internal currency (from the English "book"). The coin glyph
 * carries no text, so this is what assistive tech announces after the amount.
 */
const BUKA_FORMS: Record<string, string> = {
  one: "бука",
  few: "буки",
  many: "буков",
  other: "буки",
};

const BOOK_FORMS: Record<string, string> = {
  one: "книга",
  few: "книги",
  many: "книг",
  other: "книги",
};

const pluralRules = new Intl.PluralRules("ru-RU");

/** The correct form of "бука" for an amount: 1 бука, 2 буки, 1100 буков. */
export function bukaLabel(amount: number): string {
  return BUKA_FORMS[pluralRules.select(amount)] ?? "буков";
}

/** The correct form of "книга" for a count: 1 книга, 2 книги, 5 книг. */
export function bookLabel(count: number): string {
  return BOOK_FORMS[pluralRules.select(count)] ?? "книг";
}

/** `dt` arrives from the backend in milliseconds. */
export function formatOrderDate(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return `Сегодня, ${time}`;
  if (diffDays === 1) return `Вчера, ${time}`;

  return (
    date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) +
    `, ${time}`
  );
}

/**
 * СДЭК addresses arrive as "400137, Россия, Волгоградская область, ...".
 * The postcode and country are noise on a card where the point is already
 * identified by its code, so both are dropped — but only when they match
 * exactly at the start, so an unexpected format is left untouched.
 */
export function tidyAddress(address: string): string {
  return address
    .replace(/^\s*\d{6},\s*/, "")
    .replace(/^Россия,\s*/i, "")
    .trim();
}
