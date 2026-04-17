// Pension calculator math.
// Phase 1: accumulation with monthly contributions and annual return.
// Phase 2: retirement with sustainable withdrawal until life expectancy.

export interface PensionInputs {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedReturnPct: number; // nominal % p.a.
  inflationPct: number; // % p.a.
  desiredMonthlyPensionToday: number; // in today's CZK
  lifeExpectancy: number; // age at end of plan
}

export interface PensionYearRow {
  age: number;
  yearIndex: number;
  nominalBalance: number;
  realBalance: number;
  phase: "accumulation" | "retirement";
  contributedThisYear: number;
  withdrawnThisYear: number;
}

export interface PensionResult {
  potAtRetirement: number; // nominal
  potAtRetirementReal: number; // today's CZK
  sustainableMonthlyNominal: number; // monthly withdrawal at retirement (nominal at that time, but kept constant in real terms by indexing)
  sustainableMonthlyReal: number; // in today's CZK
  desiredMonthlyAtRetirementNominal: number;
  gapMonthlyReal: number; // sustainableReal - desiredReal (negative = shortfall)
  yearsContributing: number;
  yearsInRetirement: number;
  schedule: PensionYearRow[];
  warnings: string[];
}

export function calcPension(input: PensionInputs): PensionResult {
  const warnings: string[] = [];
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    expectedReturnPct,
    inflationPct,
    desiredMonthlyPensionToday,
    lifeExpectancy,
  } = input;

  if (retirementAge <= currentAge) {
    warnings.push("Věk odchodu do důchodu musí být vyšší než aktuální věk.");
  }
  if (lifeExpectancy <= retirementAge) {
    warnings.push("Doba dožití musí být vyšší než věk odchodu do důchodu.");
  }

  const yearsContributing = Math.max(0, retirementAge - currentAge);
  const yearsInRetirement = Math.max(0, lifeExpectancy - retirementAge);
  const r = expectedReturnPct / 100;
  const i = inflationPct / 100;
  const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;

  const schedule: PensionYearRow[] = [];
  let balance = currentSavings;

  // Accumulation
  for (let y = 0; y < yearsContributing; y++) {
    let contributed = 0;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      contributed += monthlyContribution;
    }
    const age = currentAge + y + 1;
    const realBalance = balance / Math.pow(1 + i, y + 1);
    schedule.push({
      age,
      yearIndex: y + 1,
      nominalBalance: balance,
      realBalance,
      phase: "accumulation",
      contributedThisYear: contributed,
      withdrawnThisYear: 0,
    });
  }

  const potNominal = balance;
  const potReal = potNominal / Math.pow(1 + i, yearsContributing);

  // Sustainable withdrawal: solve for monthly amount W (in real terms, today's CZK)
  // that depletes the pot over yearsInRetirement, with returns growing nominally
  // and withdrawal being indexed to inflation (kept constant in real terms).
  // Real return: r_real = (1+r)/(1+i) - 1
  const realReturn = (1 + r) / (1 + i) - 1;
  const monthsRet = yearsInRetirement * 12;
  const monthlyRealRate = monthsRet > 0 ? Math.pow(1 + realReturn, 1 / 12) - 1 : 0;

  let sustainableMonthlyReal = 0;
  if (monthsRet > 0) {
    // PMT formula: W = P * r / (1 - (1+r)^-n), with P = potReal
    if (Math.abs(monthlyRealRate) < 1e-9) {
      sustainableMonthlyReal = potReal / monthsRet;
    } else {
      sustainableMonthlyReal =
        (potReal * monthlyRealRate) / (1 - Math.pow(1 + monthlyRealRate, -monthsRet));
    }
  }

  // Retirement schedule (nominal): withdraw inflation-indexed amount each month
  const retirementStartYear = yearsContributing;
  for (let y = 0; y < yearsInRetirement; y++) {
    let withdrawnThisYear = 0;
    for (let m = 0; m < 12; m++) {
      const elapsedYears = y + (m + 1) / 12;
      // Nominal withdrawal at this point indexes today's real amount
      const nominalWithdraw =
        sustainableMonthlyReal * Math.pow(1 + i, retirementStartYear + elapsedYears);
      balance = balance * (1 + monthlyRate) - nominalWithdraw;
      withdrawnThisYear += nominalWithdraw;
      if (balance < 0) balance = 0;
    }
    const age = currentAge + retirementStartYear + y + 1;
    const yearsFromNow = retirementStartYear + y + 1;
    schedule.push({
      age,
      yearIndex: yearsFromNow,
      nominalBalance: balance,
      realBalance: balance / Math.pow(1 + i, yearsFromNow),
      phase: "retirement",
      contributedThisYear: 0,
      withdrawnThisYear,
    });
  }

  const desiredMonthlyAtRetirementNominal =
    desiredMonthlyPensionToday * Math.pow(1 + i, yearsContributing);

  return {
    potAtRetirement: potNominal,
    potAtRetirementReal: potReal,
    sustainableMonthlyNominal:
      sustainableMonthlyReal * Math.pow(1 + i, yearsContributing),
    sustainableMonthlyReal,
    desiredMonthlyAtRetirementNominal,
    gapMonthlyReal: sustainableMonthlyReal - desiredMonthlyPensionToday,
    yearsContributing,
    yearsInRetirement,
    schedule,
    warnings,
  };
}
