/** What formatting money needs to know about a place. Countries and estimate places both fit. */
type Money = { locale: string; currency: string };

export function money(country: Money, amount: number): string {
  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/** Compact money for tight spots: £32k, $1.2m. */
export function moneyShort(country: Money, amount: number): string {
  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    notation: "compact",
    maximumFractionDigits: amount >= 100000 ? 0 : 1,
  })
    .format(amount)
    .toLowerCase();
}

export function currencySymbol(country: Money): string {
  const parts = new Intl.NumberFormat(country.locale, { style: "currency", currency: country.currency }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? "";
}

/** Digits typed by a person ("32,000", "£32k", "32.5") as a number, or null. */
export function parsePay(input: string): number | null {
  const cleaned = input.trim().toLowerCase().replace(/[, _]/g, "").replace(/^[^\d.]+/, "");
  const match = /^(\d+(?:\.\d+)?)(k|m)?$/.exec(cleaned);
  if (!match) return null;
  const value = Number(match[1]) * (match[2] === "k" ? 1_000 : match[2] === "m" ? 1_000_000 : 1);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** 34.2 -> "34%". Never shows 0% or 100%, which would overstate what the data can say. */
export function percent(value: number): string {
  return `${Math.min(99, Math.max(1, Math.round(value)))}%`;
}

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** "2023-24 financial year (1 July 2023 to 30 June 2024)" -> "2023-24 financial year". */
export function shortPeriod(period: string): string {
  return period.replace(/\s*\([^)]*\)\s*$/, "") || period;
}
