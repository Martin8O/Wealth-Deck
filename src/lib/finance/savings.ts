// Savings accounts calculator with tiered interest rates.
// A tier defines: a base rate up to a balance cap, and a rate above the cap.

export interface SavingsAccount {
  id: string;
  name: string;
  rateBelowPct: number; // % p.a. up to cap
  cap: number; // balance cap (CZK); above this, rateAbove applies
  rateAbovePct: number; // % p.a. above cap
}

export interface SavingsInputs {
  initialDeposit: number;
  monthlyDeposit: number;
  months: number;
  applyTax: boolean; // 15% withholding on interest
  accounts: SavingsAccount[];
}

export interface SavingsMonthRow {
  month: number;
  balance: number;
  interestThisMonth: number;
}

export interface SavingsAccountResult {
  account: SavingsAccount;
  finalBalance: number;
  totalInterest: number;
  totalDeposited: number;
  effectiveAnnualPct: number;
  schedule: SavingsMonthRow[];
}

const TAX = 0.15;

function blendedAnnualRate(balance: number, acc: SavingsAccount): number {
  if (balance <= acc.cap) return acc.rateBelowPct / 100;
  // Weighted blend: portion up to cap earns rateBelow, rest earns rateAbove
  const below = (acc.cap * acc.rateBelowPct) / 100;
  const above = ((balance - acc.cap) * acc.rateAbovePct) / 100;
  return (below + above) / balance;
}

export function calcSavings(input: SavingsInputs): SavingsAccountResult[] {
  const results: SavingsAccountResult[] = [];

  for (const acc of input.accounts) {
    let balance = input.initialDeposit;
    let totalInterest = 0;
    const schedule: SavingsMonthRow[] = [];

    for (let m = 1; m <= input.months; m++) {
      // Add monthly deposit at start of month
      balance += input.monthlyDeposit;
      const annual = blendedAnnualRate(balance, acc);
      const monthlyRate = Math.pow(1 + annual, 1 / 12) - 1;
      let interest = balance * monthlyRate;
      if (input.applyTax) interest *= 1 - TAX;
      balance += interest;
      totalInterest += interest;
      schedule.push({ month: m, balance, interestThisMonth: interest });
    }

    const totalDeposited = input.initialDeposit + input.monthlyDeposit * input.months;
    const years = input.months / 12;
    const effective =
      input.initialDeposit > 0 && years > 0
        ? Math.pow(balance / Math.max(1, totalDeposited), 1 / years) - 1
        : 0;

    results.push({
      account: acc,
      finalBalance: balance,
      totalInterest,
      totalDeposited,
      effectiveAnnualPct: effective * 100,
      schedule,
    });
  }

  return results;
}

export const DEFAULT_ACCOUNTS: SavingsAccount[] = [
  { id: "csob", name: "ČSOB Spořicí", rateBelowPct: 4.0, cap: 250_000, rateAbovePct: 0.5 },
  { id: "mbank", name: "mBank eMax Plus", rateBelowPct: 3.75, cap: 500_000, rateAbovePct: 1.0 },
  { id: "custom", name: "Vlastní účet", rateBelowPct: 4.5, cap: 300_000, rateAbovePct: 1.5 },
];
