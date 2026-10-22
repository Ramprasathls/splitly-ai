// Currencies supported for entry and display (ECB reference rates via
// frankfurter.dev). The ledger itself is always USD.
export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "INR",
  "MXN",
  "BRL",
  "KRW",
  "SGD",
  "HKD",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "ZAR",
  "THB",
] as const;

export type Currency = (typeof CURRENCIES)[number];

// Currencies with no minor unit: entered as whole units ("4500", never "45.5").
// Amounts are still stored as hundredths of a unit, like every other currency.
const ZERO_DECIMAL: readonly string[] = ["JPY", "KRW"];

export function currencyDecimals(currency: string): 0 | 2 {
  return ZERO_DECIMAL.includes(currency) ? 0 : 2;
}

/** Validates a `?currency=` value; anything unknown falls back to USD. */
export function parseCurrency(value: string | string[] | undefined): Currency {
  const code = Array.isArray(value) ? value[0] : value;
  return (CURRENCIES as readonly string[]).includes(code ?? "")
    ? (code as Currency)
    : "USD";
}
