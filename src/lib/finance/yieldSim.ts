// Flexible STRF/STRC-style yield simulator.
import { Frequency, payoutsPerYear } from "./frequency";

export interface YieldSimInputs {
  initialInvestment: number;
  monthlyContribution: number;
  yieldPct: number; // % p.a.
  payoutFrequency: Frequency;
  horizonMonths: number;
  taxPct: number;
  inflationPct: number;
  reinvest: boolean;
}

export interface YieldSimMonthRow {
  month: number;
  balance: number;
  contributed: number;
  yieldGross: number;
  yieldNet: number;
  paidOut: number;
}

export interface YieldSimResult {
  finalBalance: number;
  realFinalBalance: number;
  totalContributed: number;
  totalYieldGross: number;
  totalYieldNet: number;
  totalPaidOut: number;
  effectiveAfterTaxPct: number;
  effectiveRealPct: number;
  schedule: YieldSimMonthRow[];
}

export function calcYieldSim(input: YieldSimInputs): YieldSimResult {
  const months = Math.max(1, Math.round(input.horizonMonths));
  const ppy = payoutsPerYear(input.payoutFrequency);
  const monthsBetween = Math.round(12 / ppy);
  const yieldPerPayout = input.yieldPct / 100 / ppy;
  const inflMonthly = Math.pow(1 + input.inflationPct / 100, 1 / 12) - 1;

  let balance = input.initialInvestment;
  let contributed = input.initialInvestment;
  let totalYieldGross = 0;
  let totalYieldNet = 0;
  let totalPaidOut = 0;
  const schedule: YieldSimMonthRow[] = [];

  for (let m = 1; m <= months; m++) {
    balance += input.monthlyContribution;
    contributed += input.monthlyContribution;

    let yieldGross = 0;
    let yieldNet = 0;
    let paidOut = 0;
    if (m % monthsBetween === 0 && yieldPerPayout > 0) {
      yieldGross = balance * yieldPerPayout;
      yieldNet = yieldGross * (1 - input.taxPct / 100);
      totalYieldGross += yieldGross;
      totalYieldNet += yieldNet;
      if (input.reinvest) {
        balance += yieldNet;
      } else {
        paidOut = yieldNet;
        totalPaidOut += yieldNet;
      }
    }
    schedule.push({ month: m, balance, contributed, yieldGross, yieldNet, paidOut });
  }

  const years = months / 12;
  const realFinal = balance / Math.pow(1 + inflMonthly, months);
  const effectiveAfterTax =
    contributed > 0 && years > 0 && balance + totalPaidOut > 0
      ? Math.pow((balance + totalPaidOut) / Math.max(1, contributed), 1 / years) - 1
      : 0;
  const effectiveReal = (1 + effectiveAfterTax) / (1 + input.inflationPct / 100) - 1;

  return {
    finalBalance: balance,
    realFinalBalance: realFinal,
    totalContributed: contributed,
    totalYieldGross,
    totalYieldNet,
    totalPaidOut,
    effectiveAfterTaxPct: effectiveAfterTax * 100,
    effectiveRealPct: effectiveReal * 100,
    schedule,
  };
}
