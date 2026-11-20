/**
 * Countries the AI estimate offers by name. Two have official figures on the site (GB and US);
 * every other one runs on the AI estimate alone. The list is 50 of the world's most populated
 * countries plus Australia and New Zealand; anywhere not listed can be typed in by hand.
 *
 * `the` marks names that read "in the Philippines". Currency is the ISO 4217 code.
 */
export type WorldCountry = { iso: string; name: string; currency: string; the?: true };

export const WORLD: WorldCountry[] = [
  { iso: "AF", name: "Afghanistan", currency: "AFN" },
  { iso: "DZ", name: "Algeria", currency: "DZD" },
  { iso: "AO", name: "Angola", currency: "AOA" },
  { iso: "AR", name: "Argentina", currency: "ARS" },
  { iso: "AU", name: "Australia", currency: "AUD" },
  { iso: "BD", name: "Bangladesh", currency: "BDT" },
  { iso: "BR", name: "Brazil", currency: "BRL" },
  { iso: "CA", name: "Canada", currency: "CAD" },
  { iso: "CN", name: "China", currency: "CNY" },
  { iso: "CO", name: "Colombia", currency: "COP" },
  { iso: "CI", name: "Côte d'Ivoire", currency: "XOF" },
  { iso: "CD", name: "DR Congo", currency: "CDF", the: true },
  { iso: "EG", name: "Egypt", currency: "EGP" },
  { iso: "ET", name: "Ethiopia", currency: "ETB" },
  { iso: "FR", name: "France", currency: "EUR" },
  { iso: "DE", name: "Germany", currency: "EUR" },
  { iso: "GH", name: "Ghana", currency: "GHS" },
  { iso: "IN", name: "India", currency: "INR" },
  { iso: "ID", name: "Indonesia", currency: "IDR" },
  { iso: "IR", name: "Iran", currency: "IRR" },
  { iso: "IQ", name: "Iraq", currency: "IQD" },
  { iso: "IT", name: "Italy", currency: "EUR" },
  { iso: "JP", name: "Japan", currency: "JPY" },
  { iso: "KE", name: "Kenya", currency: "KES" },
  { iso: "MG", name: "Madagascar", currency: "MGA" },
  { iso: "MY", name: "Malaysia", currency: "MYR" },
  { iso: "MX", name: "Mexico", currency: "MXN" },
  { iso: "MA", name: "Morocco", currency: "MAD" },
  { iso: "MZ", name: "Mozambique", currency: "MZN" },
  { iso: "MM", name: "Myanmar", currency: "MMK" },
  { iso: "NZ", name: "New Zealand", currency: "NZD" },
  { iso: "NG", name: "Nigeria", currency: "NGN" },
  { iso: "PK", name: "Pakistan", currency: "PKR" },
  { iso: "PE", name: "Peru", currency: "PEN" },
  { iso: "PH", name: "Philippines", currency: "PHP", the: true },
  { iso: "PL", name: "Poland", currency: "PLN" },
  { iso: "RU", name: "Russia", currency: "RUB" },
  { iso: "SA", name: "Saudi Arabia", currency: "SAR" },
  { iso: "ZA", name: "South Africa", currency: "ZAR" },
  { iso: "KR", name: "South Korea", currency: "KRW" },
  { iso: "ES", name: "Spain", currency: "EUR" },
  { iso: "SD", name: "Sudan", currency: "SDG" },
  { iso: "TZ", name: "Tanzania", currency: "TZS" },
  { iso: "TH", name: "Thailand", currency: "THB" },
  { iso: "TR", name: "Turkey", currency: "TRY" },
  { iso: "UG", name: "Uganda", currency: "UGX" },
  { iso: "UA", name: "Ukraine", currency: "UAH" },
  { iso: "GB", name: "United Kingdom", currency: "GBP", the: true },
  { iso: "US", name: "United States", currency: "USD", the: true },
  { iso: "UZ", name: "Uzbekistan", currency: "UZS" },
  { iso: "VN", name: "Vietnam", currency: "VND" },
  { iso: "YE", name: "Yemen", currency: "YER" },
];

/** Countries offered under "Other": everything on the list except the two with official figures. */
export const OTHER_COUNTRIES = WORLD.filter((country) => country.iso !== "GB" && country.iso !== "US");

export function worldCountry(iso: string): WorldCountry | undefined {
  return WORLD.find((country) => country.iso === iso.toUpperCase());
}

/** How a country reads after "in": "India", "the Philippines". */
export const inName = (country: WorldCountry) => (country.the ? `the ${country.name}` : country.name);

/**
 * Where an estimate is for: a listed country, or a place someone typed. This is what the result
 * screens need from a country, and the four countries with official data satisfy it too.
 */
export type Place = {
  /** Short code for analytics and sign-ups: "uk", "us", an ISO code, or "other". */
  code: string;
  name: string;
  inName: string;
  locale: string;
  /** ISO 4217 currency code. */
  currency: string;
  /** Publisher of official figures; unused for estimates. */
  publisher: string;
  fullTimeHours: number;
  caveat?: string;
};

export function placeFor(country: WorldCountry): Place {
  return { code: country.iso.toLowerCase(), name: country.name, inName: inName(country), locale: `en-${country.iso}`, currency: country.currency, publisher: "", fullTimeHours: 40 };
}

/** A country someone typed, made safe to send: one line of 2 to 40 letters. */
export function cleanPlaceName(raw: string): string | null {
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length < 2 || text.length > 40) return null;
  return /^[\p{L} .'’()-]+$/u.test(text) ? text : null;
}

/** A typed place has no known currency until the estimate comes back with one. */
export function typedPlace(name: string, currency: string): Place {
  return { code: "other", name, inName: name, locale: "en", currency, publisher: "", fullTimeHours: 40 };
}
