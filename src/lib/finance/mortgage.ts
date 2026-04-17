// Mortgage calculator math.

export interface MortgageInputs {
  propertyPrice: number;
  downPayment: number;
  loanTermYears: number;
  interestRatePct: number; // % p.a.
  extraMonthlyPayment: number;
}

export interface AmortRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  extra: number;
  balance: number;
}

export interface MortgageResult {
  loanAmount: number;
  monthlyPayment: number; // base annuity, without extra
  monthlyTotal: number; // with extra
  totalInterest: number;
  totalPaid: number;
  ltv: number;
  ltvWarning: "ok" | "warn80" | "warn90";
  monthsToPayoff: number;
  schedule: AmortRow[];
  warnings: string[];
}

export function calcMortgage(input: MortgageInputs): MortgageResult {
  const warnings: string[] = [];
  const loan = Math.max(0, input.propertyPrice - input.downPayment);
  const n = Math.max(1, Math.round(input.loanTermYears * 12));
  const r = input.interestRatePct / 100 / 12;
  const extra = Math.max(0, input.extraMonthlyPayment);

  const monthlyPayment =
    r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));

  const schedule: AmortRow[] = [];
  let balance = loan;
  let totalInterest = 0;
  let totalPaid = 0;
  let months = 0;

  for (let m = 1; m <= n + 1; m++) {
    if (balance <= 0.01) break;
    const interest = balance * r;
    let principal = monthlyPayment - interest;
    let extraPay = extra;
    if (principal + extraPay > balance) {
      // last payment
      principal = Math.max(0, balance - extraPay);
      if (extraPay > balance) extraPay = balance;
    }
    balance -= principal + extraPay;
    if (balance < 0) balance = 0;
    const payment = principal + interest;
    totalInterest += interest;
    totalPaid += payment + extraPay;
    months = m;
    schedule.push({ month: m, payment, interest, principal, extra: extraPay, balance });
  }

  const ltv = input.propertyPrice > 0 ? loan / input.propertyPrice : 0;
  let ltvWarning: MortgageResult["ltvWarning"] = "ok";
  if (ltv > 0.9) {
    ltvWarning = "warn90";
    warnings.push("LTV nad 90 % — banky obvykle nepůjčí, nebo vyžadují vyšší úrok.");
  } else if (ltv > 0.8) {
    ltvWarning = "warn80";
    warnings.push("LTV nad 80 % — očekávejte přirážku k úroku.");
  }

  return {
    loanAmount: loan,
    monthlyPayment,
    monthlyTotal: monthlyPayment + extra,
    totalInterest,
    totalPaid,
    ltv,
    ltvWarning,
    monthsToPayoff: months,
    schedule,
    warnings,
  };
}
