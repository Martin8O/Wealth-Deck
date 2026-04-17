// Multi-asset investment portfolio.
// Each asset is EITHER:
//   - growth-only (paysDividends = false): capital appreciation only
//   - dividend-paying (paysDividends = true): yield is paid out at chosen frequency,
//     with optional reinvestment. No double-counting with capital growth.
import { Frequency, payoutsPerYear } from "./frequency";

export type ReturnMode = "percent" | "monthly_czk";

export interface InvestmentAsset {
  id: string;
  name: string;
  invested: number; // initial CZK invested
  monthlyContribution: number;
  returnMode: ReturnMode;
  returnPct: number; // % p.a. (when returnMode = percent) — used when paysDividends = false
  monthlyReturnCZK: number; // CZK/month (when returnMode = monthly_czk) — used when paysDividends = false
  taxPct: number; // dividend / yield withholding tax %
  reinvest: boolean; // reinvest dividends back into balance
  paysDividends: boolean;
  dividendYieldPct: number; // % p.a. of balance paid as dividends
  dividendFrequency: Frequency;
}

export interface InvestmentInputs {
  horizonMonths: number;
  inflationPct: number;
  assets: InvestmentAsset[];
}

export interface AssetMonthRow {
  month: number;
  balance: number;
  contributed: number;
  growth: number;
  dividend: number;
  reinvested: number;
  paidOut: number;
}

export interface AssetResult {
  asset: InvestmentAsset;
  finalBalance: number;
  totalContributed: number;
  totalGrowth: number;
  totalDividends: number;
  totalDividendsReinvested: number;
  totalDividendsPaidOut: number;
  averageMonthlyDividend: number;
  annualDividend: number; // expected at final balance
  effectiveAnnualPct: number; // CAGR from contributions to final
  realFinalBalance: number;
  schedule: AssetMonthRow[];
}

export interface PortfolioResult {
  perAsset: AssetResult[];
  totalFinalBalance: number;
  totalContributed: number;
  totalGrowth: number;
  totalDividendsAnnual: number;
  averageMonthlyDividend: number;
  weightedYieldPct: number;
  realFinalBalance: number;
}

export function calcInvestment(input: InvestmentInputs): PortfolioResult {
  const perAsset: AssetResult[] = [];
  const months = Math.max(1, Math.round(input.horizonMonths));
  const inflMonthly = Math.pow(1 + input.inflationPct / 100, 1 / 12) - 1;

  for (const asset of input.assets) {
    const schedule: AssetMonthRow[] = [];
    let balance = asset.invested;
    let contributed = asset.invested;
    let totalGrowth = 0;
    let totalDividends = 0;
    let totalDividendsReinvested = 0;
    let totalDividendsPaidOut = 0;

    const ppy = payoutsPerYear(asset.dividendFrequency);
    const monthsBetween = Math.max(1, Math.round(12 / ppy));

    // Per-period accrual rate on the balance.
    // For dividend assets the yield IS the return (no separate capital growth).
    // For growth-only assets we compound monthly from returnPct (or add flat CZK).
    const annualYield = asset.paysDividends
      ? asset.dividendYieldPct / 100
      : asset.returnMode === "percent"
        ? asset.returnPct / 100
        : 0;
    const monthlyAccrualRate = Math.pow(1 + annualYield, 1 / 12) - 1;
    const flatMonthlyCZK =
      !asset.paysDividends && asset.returnMode === "monthly_czk"
        ? asset.monthlyReturnCZK
        : 0;

    // For dividend assets: accrue gross internally each month, then on payout
    // months the accrued amount is taxed and either paid out or reinvested.
    let accruedGross = 0;

    for (let m = 1; m <= months; m++) {
      // Monthly contribution at the start of month
      balance += asset.monthlyContribution;
      contributed += asset.monthlyContribution;

      let growth = 0;
      let dividend = 0;
      let reinvested = 0;
      let paidOut = 0;

      if (asset.paysDividends) {
        // Accrue gross yield on current balance — does NOT compound mid-period
        // (it sits aside until payout to avoid double-counting with the dividend).
        const grossThisMonth = balance * monthlyAccrualRate;
        accruedGross += grossThisMonth;

        if (m % monthsBetween === 0) {
          const gross = accruedGross;
          accruedGross = 0;
          const net = gross * (1 - asset.taxPct / 100);
          dividend = net;
          totalDividends += net;
          if (asset.reinvest) {
            balance += net; // net dividend joins the principal
            reinvested = net;
            totalDividendsReinvested += net;
            growth = net; // treat reinvested net as the growth contribution
            totalGrowth += net;
          } else {
            paidOut = net; // leaves the portfolio
            totalDividendsPaidOut += net;
            // balance unchanged — yield was paid out, principal stays
          }
        }
      } else {
        // Growth-only asset
        if (asset.returnMode === "percent") {
          growth = balance * monthlyAccrualRate;
        } else {
          growth = flatMonthlyCZK;
        }
        balance += growth;
        totalGrowth += growth;
      }

      if (balance < 0) balance = 0;
      schedule.push({ month: m, balance, contributed, growth, dividend, reinvested, paidOut });
    }

    const years = months / 12;
    const baseline = Math.max(1, asset.invested + asset.monthlyContribution * months * 0.5);
    const cagr =
      years > 0 && balance > 0
        ? Math.pow(Math.max(balance, 1) / baseline, 1 / years) - 1
        : 0;

    const realFinal = balance / Math.pow(1 + inflMonthly, months);
    const expectedAnnualDividend = asset.paysDividends
      ? balance * (asset.dividendYieldPct / 100) * (1 - asset.taxPct / 100)
      : 0;

    perAsset.push({
      asset,
      finalBalance: balance,
      totalContributed: contributed,
      totalGrowth,
      totalDividends,
      totalDividendsReinvested,
      totalDividendsPaidOut,
      averageMonthlyDividend: totalDividends / months,
      annualDividend: expectedAnnualDividend,
      effectiveAnnualPct: cagr * 100,
      realFinalBalance: realFinal,
      schedule,
    });
  }

  const totalFinalBalance = perAsset.reduce((s, a) => s + a.finalBalance, 0);
  const totalContributed = perAsset.reduce((s, a) => s + a.totalContributed, 0);
  const totalGrowth = perAsset.reduce((s, a) => s + a.totalGrowth, 0);
  const totalDividendsAnnual = perAsset.reduce((s, a) => s + a.annualDividend, 0);
  const averageMonthlyDividend = perAsset.reduce((s, a) => s + a.averageMonthlyDividend, 0);
  const weighted =
    totalFinalBalance > 0
      ? perAsset.reduce((s, a) => s + a.effectiveAnnualPct * a.finalBalance, 0) /
        totalFinalBalance
      : 0;
  const realFinalBalance = perAsset.reduce((s, a) => s + a.realFinalBalance, 0);

  return {
    perAsset,
    totalFinalBalance,
    totalContributed,
    totalGrowth,
    totalDividendsAnnual,
    averageMonthlyDividend,
    weightedYieldPct: weighted,
    realFinalBalance,
  };
}
