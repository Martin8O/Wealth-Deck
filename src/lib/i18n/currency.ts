// Currency model. Each currency declares its locale (for number formatting),
// the slider/numeric "scale" (used to derive sensible upper limits and steps
// per calculator field), and the symbol. We do NOT do FX conversion of stored
// values — switching currency simply re-labels and re-scales presets/limits.
//
// Caps target (per user spec):
//  - Big amounts (initial investment, current savings, property price, total
//    savings, monthly contribution caps too live in `bigCap`):
//      USD: 1M, EUR: 1M, CZK: 20M
//  - Monthly amounts (monthlyCap — monthly contributions, extra mortgage
//    payment, monthly fixed-CZK return):
//      USD: 10k, EUR: 10k, CZK: 250k

export type CurrencyCode = "USD" | "EUR" | "CZK";

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "CZK", label: "CZK" },
];

export interface CurrencySpec {
  code: CurrencyCode;
  symbol: string;
  /** Locale used for number formatting in this currency. */
  locale: string;
  /** Big-money cap. Used for: property price, total savings, current savings,
   *  initial investment, asset invested, total savings to deposit. */
  bigCap: number;
  /** Mid-money cap. Same semantics as `bigCap` in this app — kept for
   *  back-compat with components that still reference it. */
  midCap: number;
  /** Monthly cap (monthly contributions, extra mortgage payment, etc.). */
  smallCap: number;
  /** Tiny cap for monthly fixed-CZK return slot. */
  tinyCap: number;
  /** Step for big amounts. */
  bigStep: number;
  /** Step for mid amounts. */
  midStep: number;
  /** Step for small (monthly) amounts. */
  smallStep: number;
  /** Step for tiny amounts. */
  tinyStep: number;
  /** Default placeholder values per typical input slot (used for sensible resets). */
  defaults: {
    pensionSavings: number;
    pensionMonthly: number;
    pensionDesired: number;
    mortgagePrice: number;
    mortgageDown: number;
    mortgageExtra: number;
    savingsTotal: number;
    savingsMonthly: number;
    savingsAccountCap: number;
    investmentInvested: number;
    investmentMonthly: number;
    investmentMonthlyReturn: number;
    yieldInitial: number;
    yieldMonthly: number;
  };
}

export const CURRENCIES: Record<CurrencyCode, CurrencySpec> = {
  USD: {
    code: "USD",
    symbol: "$",
    locale: "en-US",
    bigCap: 1_000_000,
    midCap: 1_000_000,
    smallCap: 10_000,
    tinyCap: 10_000,
    bigStep: 5_000,
    midStep: 5_000,
    smallStep: 50,
    tinyStep: 25,
    defaults: {
      pensionSavings: 10_000,
      pensionMonthly: 250,
      pensionDesired: 1_500,
      mortgagePrice: 300_000,
      mortgageDown: 60_000,
      mortgageExtra: 0,
      savingsTotal: 25_000,
      savingsMonthly: 250,
      savingsAccountCap: 10_000,
      investmentInvested: 5_000,
      investmentMonthly: 100,
      investmentMonthlyReturn: 50,
      yieldInitial: 5_000,
      yieldMonthly: 250,
    },
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    locale: "de-DE",
    bigCap: 1_000_000,
    midCap: 1_000_000,
    smallCap: 10_000,
    tinyCap: 10_000,
    bigStep: 5_000,
    midStep: 5_000,
    smallStep: 50,
    tinyStep: 25,
    defaults: {
      pensionSavings: 10_000,
      pensionMonthly: 250,
      pensionDesired: 1_500,
      mortgagePrice: 300_000,
      mortgageDown: 60_000,
      mortgageExtra: 0,
      savingsTotal: 25_000,
      savingsMonthly: 250,
      savingsAccountCap: 10_000,
      investmentInvested: 5_000,
      investmentMonthly: 100,
      investmentMonthlyReturn: 50,
      yieldInitial: 5_000,
      yieldMonthly: 250,
    },
  },
  CZK: {
    code: "CZK",
    symbol: "Kč",
    locale: "cs-CZ",
    bigCap: 20_000_000,
    midCap: 20_000_000,
    smallCap: 250_000,
    tinyCap: 250_000,
    bigStep: 50_000,
    midStep: 50_000,
    smallStep: 500,
    tinyStep: 250,
    defaults: {
      pensionSavings: 200_000,
      pensionMonthly: 5_000,
      pensionDesired: 30_000,
      mortgagePrice: 6_000_000,
      mortgageDown: 1_200_000,
      mortgageExtra: 0,
      savingsTotal: 500_000,
      savingsMonthly: 5_000,
      savingsAccountCap: 250_000,
      investmentInvested: 100_000,
      investmentMonthly: 2_000,
      investmentMonthlyReturn: 1_000,
      yieldInitial: 100_000,
      yieldMonthly: 5_000,
    },
  },
};

export function getCurrency(c: CurrencyCode): CurrencySpec {
  return CURRENCIES[c];
}
