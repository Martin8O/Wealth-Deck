// Czech locale formatting helpers.

const czk = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
});

const czk2 = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
const num2 = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat("cs-CZ", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatCZK(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "—";
  return decimals > 0 ? czk2.format(value) : czk.format(Math.round(value));
}

export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "—";
  return decimals > 0 ? num2.format(value) : num.format(Math.round(value));
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return pct.format(value);
}

/** Format percentage where input is already in %, e.g. 5.5 => "5,5 %". */
export function formatPct(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toLocaleString("cs-CZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} %`;
}

export function formatYears(months: number): string {
  if (!Number.isFinite(months)) return "—";
  const y = Math.floor(months / 12);
  const m = Math.round(months - y * 12);
  if (y === 0) return `${m} měs.`;
  if (m === 0) return `${y} let`;
  return `${y} l. ${m} m.`;
}
