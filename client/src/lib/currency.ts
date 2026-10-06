export type DisplayCurrency = "USD" | "NGN";

export const USD_TO_NGN_RATE = 1400;

export const PROGRAMME_PRICES_USD = {
  Foundation: 575_000 / USD_TO_NGN_RATE,
  "Engine Room": 875_000 / USD_TO_NGN_RATE,
  Boardroom: 1_500_000 / USD_TO_NGN_RATE,
} as const;

export function formatProgrammePrice(packageName: keyof typeof PROGRAMME_PRICES_USD, currency: DisplayCurrency) {
  const usdValue = PROGRAMME_PRICES_USD[packageName];
  const value = currency === "USD" ? usdValue : usdValue * USD_TO_NGN_RATE;
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 0 : 0,
  }).format(value);
}

export function currencyReferenceLabel(currency: DisplayCurrency) {
  return currency === "USD" ? "USD display · reference rate $1 = ₦1,400" : "NGN display · reference rate $1 = ₦1,400";
}
