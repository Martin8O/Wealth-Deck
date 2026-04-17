
## Finanční Kalkulátory — Sjednocená aplikace

One unified app containing all 5 Czech calculators, with a landing dashboard and the selected calculator rendered below the cards.

### 1. App shell & navigation
- Single route `/` with a hero header + 5 selectable calculator cards in a responsive grid.
- Click a card → smoothly scroll/reveal the chosen calculator below the grid; selected card stays visually "active"; second click (or close button) collapses it.
- Sticky thin top bar appears once a calculator is open with: calculator name, "← Zpět na výběr" button, and a light/dark toggle.

### 2. Unified design system
- Modern, minimal, elegant — neutral slate-zinc base with a single accent (refined teal-cyan), generous whitespace, soft 1px borders, subtle shadows, rounded-2xl cards, tabular numerals for all monetary values, smooth 200ms transitions.
- Light + dark mode with system default; persisted to localStorage.
- Typography: Inter for UI, tabular Inter / SF Mono for numbers. Czech locale (`cs-CZ`) for all formatting.
- Shared primitives: `StatCard`, `SliderField` (label + value + range + min/max hint), `Toggle`, `SegmentedControl`, `ResultBlock`. Reused across all five calculators so everything feels like one product.

### 3. The five calculators (ported + audited)

**a) Důchodová kalkulačka (Pension)**
- Inputs: current age, retirement age, current savings, monthly contribution, expected return %, inflation %, desired monthly pension, life expectancy.
- Outputs: projected pot at retirement, sustainable monthly withdrawal, gap vs. desired pension, real (inflation-adjusted) values, year-by-year chart.
- Audit fixes: ensure inflation is applied consistently (real vs. nominal clearly labeled), correct annuity-style withdrawal math, guard against age ≥ retirement age.

**b) Hypoteční simulátor (Mortgage)**
- Inputs: property price, down payment (CZK + % linked), loan term (years), interest rate, optional extra monthly payment.
- Outputs: monthly payment, total interest, total paid, LTV, full amortization schedule (table + chart of principal vs. interest over time), payoff date with extra payments.
- Audit fixes: standard annuity formula `M = P·r/(1−(1+r)^−n)`, correct handling of extra-payment recalculation, LTV warning above 80/90 %.

**c) Kalkulačka spořicích účtů (Savings accounts)**
- Inputs: initial deposit, monthly deposit, horizon (months/years), list of bank tiers with interest rates and balance caps (preserve ČSOB / mBank presets, plus a custom row).
- Outputs: side-by-side comparison cards (final balance, interest earned, effective yield), combined chart.
- Audit fixes: properly apply tiered rates (rate above cap), monthly compounding, 15 % withholding tax option, day-count consistency.

**d) Investiční simulátor (Investment portfolio)** + **new dividend feature**
- Multi-asset portfolio: per asset — name, invested amount, return mode (% p.a. ↔ CZK/month), tax %, reinvest toggle.
- **NEW — Dividend block per asset:** "Vyplácí dividendy?" Yes/No toggle. When Yes: a 4-option segmented control for frequency — **Měsíčně / Čtvrtletně / Pololetně / Ročně**. Affects:
  - Per-asset payout schedule (shows "next payout: X CZK" and average monthly equivalent).
  - Reinvestment compounding uses the chosen frequency (monthly/4×/2×/1× per year) instead of always-monthly.
  - Future-value projection and weighted yield correctly account for compounding frequency.
  - Portfolio summary shows total dividends per year + average monthly cashflow.
- Audit fixes: weighted real-yield calculation, guard against div-by-zero, persist asset list to URL hash on demand.

**e) STRF Investment Simulator → made flexible (STRC-style)**
- User configurable: initial investment, monthly contribution, **custom yield % (slider + numeric)**, **payout/compounding frequency** (Monthly / Quarterly / Semi-annual / Annual — same control as the dividend feature for consistency), horizon, tax %, inflation %.
- Outputs: future value (nominal + real), total contributions, total interest/yield, breakdown chart over time, effective yield after tax & inflation.
- Replaces the rigid STRF preset with a fully parametric simulator.

### 4. Shared QoL
- All inputs validated with sensible min/max; sliders paired with numeric inputs where helpful.
- Czech locale throughout (CZK, decimal comma, thin-space thousands).
- Charts via Recharts (line/area), consistent styling across all calculators.
- Mobile-first: cards stack, sliders full-width, sticky nav at top.

### 5. Tech notes
- TanStack Start, single route file `src/routes/index.tsx` with a `<CalculatorPicker>` and conditional `<CalculatorPanel>` below.
- Each calculator is a separate component in `src/components/calculators/`.
- Shared UI primitives in `src/components/finance/`.
- Pure-function calculation modules in `src/lib/finance/` (one file per calculator) — easy to unit-test and reuse.
- No backend needed; everything runs client-side.
