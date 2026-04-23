// Savings accounts optimizer.
// Each account has multiple tiers (rate up to a balance cap).
// The optimizer distributes a total balance across accounts so that the
// MARGINAL rate (the rate the next CZK would earn) is always maximized.
// Implementation: greedy fill of "rate slots" sorted by net rate desc.

export interface SavingsAccount {
  id: string;
  name: string;
  rateBelowPct: number; // % p.a. up to cap
  cap: number; // balance cap (CZK); above this, rateAbove applies
  rateAbovePct: number; // % p.a. above cap
}

export interface SavingsInputs {
  totalAmount: number; // total capital to distribute today
  monthlyDeposit: number; // additional monthly deposit (also optimally distributed)
  months: number;
  /** Withholding tax on interest, in percent. 0 = no tax. */
  taxPct: number;
  accounts: SavingsAccount[];
}

export interface AccountAllocation {
  accountId: string;
  accountName: string;
  amount: number; // currently allocated balance
  blendedRatePct: number; // current blended annual rate (gross)
  monthlyInterestNet: number; // net monthly interest at current balance
  annualInterestNet: number; // net annual interest at current balance
}

export interface SavingsOptimizedResult {
  allocations: AccountAllocation[]; // initial optimal split of totalAmount
  finalAllocations: AccountAllocation[]; // distribution at end of horizon
  totalInitial: number;
  totalFinal: number;
  totalInterest: number;
  totalDeposited: number;
  effectiveAnnualPct: number;
  weightedRatePct: number; // weighted gross rate of the initial allocation
  schedule: Array<{ month: number; balance: number; interestThisMonth: number }>;
  perAccountSchedule: Record<string, Array<{ month: number; balance: number }>>;
}

interface RateSlot {
  accountId: string;
  capacity: number; // CZK that can fit at this rate (Infinity for above-cap)
  ratePct: number; // gross % p.a.
}

function buildSlots(accounts: SavingsAccount[]): RateSlot[] {
  const slots: RateSlot[] = [];
  for (const a of accounts) {
    if (a.cap > 0) {
      slots.push({ accountId: a.id, capacity: a.cap, ratePct: a.rateBelowPct });
    }
    slots.push({ accountId: a.id, capacity: Infinity, ratePct: a.rateAbovePct });
  }
  // Sort by best rate first
  return slots.sort((s1, s2) => s2.ratePct - s1.ratePct);
}

/** Distribute `amount` greedily across rate slots; returns per-account totals. */
function distribute(
  amount: number,
  slots: RateSlot[],
): Record<string, number> {
  const out: Record<string, number> = {};
  let remaining = amount;
  for (const s of slots) {
    if (remaining <= 0) break;
    const take = Math.min(s.capacity, remaining);
    out[s.accountId] = (out[s.accountId] ?? 0) + take;
    remaining -= take;
  }
  return out;
}

function summarizeAllocation(
  amounts: Record<string, number>,
  accounts: SavingsAccount[],
  taxPct: number,
): AccountAllocation[] {
  const taxFactor = 1 - Math.max(0, Math.min(100, taxPct)) / 100;
  return accounts.map((a) => {
    const amount = amounts[a.id] ?? 0;
    const below = Math.min(amount, a.cap);
    const above = Math.max(0, amount - a.cap);
    const grossAnnual =
      (below * a.rateBelowPct) / 100 + (above * a.rateAbovePct) / 100;
    const blended = amount > 0 ? (grossAnnual / amount) * 100 : 0;
    const netAnnual = grossAnnual * taxFactor;
    return {
      accountId: a.id,
      accountName: a.name,
      amount,
      blendedRatePct: blended,
      monthlyInterestNet: netAnnual / 12,
      annualInterestNet: netAnnual,
    };
  });
}

export function calcSavingsOptimized(input: SavingsInputs): SavingsOptimizedResult {
  const slots = buildSlots(input.accounts);
  const taxFactor = 1 - Math.max(0, Math.min(100, input.taxPct)) / 100;

  // Initial allocation snapshot
  const initialAmounts = distribute(input.totalAmount, slots);
  const initialAllocations = summarizeAllocation(
    initialAmounts,
    input.accounts,
    input.taxPct,
  );

  // Time evolution: each month add monthlyDeposit, then re-distribute total
  // greedily. Compute month interest based on the per-account amounts and
  // their tier rates. Reinvest interest by adding to the total then
  // re-distributing next month.
  let totalBalance = input.totalAmount;
  let totalInterest = 0;
  const schedule: SavingsOptimizedResult["schedule"] = [];
  const perAccountSchedule: Record<string, Array<{ month: number; balance: number }>> = {};
  for (const a of input.accounts) perAccountSchedule[a.id] = [];

  let lastAmounts: Record<string, number> = { ...initialAmounts };

  for (let m = 1; m <= input.months; m++) {
    totalBalance += input.monthlyDeposit;
    // Re-distribute
    const amounts = distribute(totalBalance, slots);

    // Compute monthly interest from current per-account amounts
    let monthInterest = 0;
    for (const a of input.accounts) {
      const amt = amounts[a.id] ?? 0;
      const below = Math.min(amt, a.cap);
      const above = Math.max(0, amt - a.cap);
      const annualGross = (below * a.rateBelowPct) / 100 + (above * a.rateAbovePct) / 100;
      const monthlyRate = Math.pow(1 + (amt > 0 ? annualGross / amt : 0), 1 / 12) - 1;
      let int = amt * monthlyRate;
      if (input.applyTax) int *= 1 - TAX;
      monthInterest += int;
      perAccountSchedule[a.id].push({ month: m, balance: amt });
    }
    totalBalance += monthInterest;
    totalInterest += monthInterest;
    schedule.push({ month: m, balance: totalBalance, interestThisMonth: monthInterest });
    lastAmounts = amounts;
  }

  // Final allocation reflects redistribution after last interest credit
  const finalAmounts = distribute(totalBalance, slots);
  const finalAllocations = summarizeAllocation(finalAmounts, input.accounts, input.applyTax);

  const totalDeposited = input.totalAmount + input.monthlyDeposit * input.months;
  const years = input.months / 12;
  const effective =
    totalDeposited > 0 && years > 0
      ? Math.pow(totalBalance / Math.max(1, totalDeposited), 1 / years) - 1
      : 0;

  // Weighted rate of initial allocation (gross)
  const weighted = input.totalAmount > 0
    ? initialAllocations.reduce((sum, a) => sum + a.amount * a.blendedRatePct, 0) / input.totalAmount
    : 0;

  // Reference last allocation amounts for typing (silences unused var)
  void lastAmounts;

  return {
    allocations: initialAllocations,
    finalAllocations,
    totalInitial: input.totalAmount,
    totalFinal: totalBalance,
    totalInterest,
    totalDeposited,
    effectiveAnnualPct: effective * 100,
    weightedRatePct: weighted,
    schedule,
    perAccountSchedule,
  };
}

export const DEFAULT_ACCOUNTS: SavingsAccount[] = [
  { id: "csob", name: "ČSOB Spořicí", rateBelowPct: 4.0, cap: 250_000, rateAbovePct: 0.5 },
  { id: "mbank", name: "mBank eMax Plus", rateBelowPct: 3.75, cap: 500_000, rateAbovePct: 1.0 },
  { id: "trinity", name: "Trinity Spořicí", rateBelowPct: 4.5, cap: 300_000, rateAbovePct: 1.5 },
];
