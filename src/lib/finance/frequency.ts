// Shared payout/compounding frequency type used across calculators.

export type Frequency = "monthly" | "quarterly" | "semiannual" | "annual";

export const FREQUENCY_OPTIONS: { value: Frequency; label: string; perYear: number }[] = [
  { value: "monthly", label: "Měsíčně", perYear: 12 },
  { value: "quarterly", label: "Čtvrtletně", perYear: 4 },
  { value: "semiannual", label: "Pololetně", perYear: 2 },
  { value: "annual", label: "Ročně", perYear: 1 },
];

export function payoutsPerYear(f: Frequency): number {
  return FREQUENCY_OPTIONS.find((o) => o.value === f)?.perYear ?? 12;
}

export function frequencyLabel(f: Frequency): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === f)?.label ?? "";
}

export function monthsBetween(f: Frequency): number {
  return 12 / payoutsPerYear(f);
}
