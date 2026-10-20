// Currencies supported for entry and display (ECB reference rates).
// Conversion arrives in Phase 7; until then USD is the only usable currency,
// so the UI and the server action both restrict entry to ENTRY_CURRENCIES.
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

export const ENTRY_CURRENCIES: readonly Currency[] = ["USD"];
