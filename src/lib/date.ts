/** A calendar day in `YYYY-MM-DD` form, independent of time zone. */
export type IsoDate = string;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/** The calendar day of `now` in the given IANA time zone. */
export function toIsoDateInTimeZone(now: Date, timeZone: string): IsoDate {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Adds (or subtracts) whole days to a calendar day. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

/** Formats a calendar day for display, e.g. "qua., 25 de nov.". */
export function formatIsoDate(date: IsoDate): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00Z`));
}
