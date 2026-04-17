// Multi-asset investment portfolio with optional dividend payouts.
import { Frequency, payoutsPerYear } from "./frequency";

export type ReturnMode = "percent" | "monthly_czk";

export interface InvestmentAsset {
  id: string;
  name: string;
  invested: number; // initial CZK invested
  monthlyContribution: number;
  returnMode: ReturnMode;
  returnPct: number; // % p.a. (when returnMode = percent)
  monthlyReturnCZK: number; // CZK/month (when returnMode = monthly_czk)
  taxPct: number; // dividend / yield withholding tax %
  reinvest: boolean;
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

    const annualReturn =
      asset.returnMode === "percent" ? asset.returnPct / 100 : 0;
    const monthlyGrowthRate =
      asset.returnMode === "percent"
        ? Math.pow(1 + annualReturn, 1 / 12) - 1
        : 0;
    const monthlyFlatGrowth =
      asset.returnMode === "monthly_czk" ? asset.monthlyReturnCZK : 0;

    const ppy = payoutsPerYear(asset.dividendFrequency);
    const monthsBetween = Math.round(12 / ppy);
    const dividendYieldPerPayout = asset.dividendYieldPct / 100 / ppy;

    for (let m = 1; m <= months; m++) {
      // Monthly contribution at the start of month
      balance += asset.monthlyContribution;
      contributed += asset.monthlyContribution;

      // Capital growth
      let growth = 0;
      if (asset.returnMode === "percent") {
        growth = balance * monthlyGrowthRate;
      } else {
        growth = monthlyFlatGrowth;
      }
      balance += growth;
      totalGrowth += growth;

      // Dividend payout (at end of month, on payout months)
      let dividend = 0;
      let reinvested = 0;
      let paidOut = 0;
      if (asset.paysDividends && m % monthsBetween === 0 && dividendYieldPerPayout > 0) {
        const gross = balance * dividendYieldPerPayout;
        const net = gross * (1 - asset.taxPct / 100);
        dividend = net;
        totalDividends += net;
        if (asset.reinvest) {
          // Dividend stays inside the balance — but balance already includes growth.
          // Treat as: subtract gross from balance (paid out), then add back net if reinvested.
          balance = balance - gross + net;
          reinvested = net;
          totalDividendsReinvested += net;
        } else {
          balance -= gross;
          paidOut = net;
          totalDividendsPaidOut += net;
        }
      }

      if (balance < 0) balance = 0;
      schedule.push({ month: m, balance, contributed, growth, dividend, reinvested, paidOut });
    }

    const years = months / 12;
    const cagr =
      contributed > 0 && years > 0 && balance > 0
        ? Math.pow(balance / Math.max(1, asset.invested || contributed), 1 / years) - 1
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
