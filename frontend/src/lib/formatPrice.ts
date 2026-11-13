export type PriceLocale = "bn-BD" | "en-BD"

/**
 * Formats an amount as Bangladeshi Taka.
 * Defaults to Bengali digits for the public storefront; pass "en-BD"
 * for the admin panel's Latin-digit format.
 */
export function formatBdt(amount: number, locale: PriceLocale = "bn-BD"): string {
  return `৳ ${new Intl.NumberFormat(locale).format(amount)}`
}
