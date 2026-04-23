import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/finance/Panel";
import { SliderField } from "@/components/finance/SliderField";
import { StatCard } from "@/components/finance/StatCard";
import { NumberField } from "@/components/finance/NumberField";
import { Input } from "@/components/ui/input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles } from "lucide-react";
import {
  calcSavingsOptimized,
  DEFAULT_ACCOUNTS,
  type SavingsAccount,
} from "@/lib/finance/savings";
import { useI18n } from "@/lib/i18n/context";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function makeDefaultAccounts(spec: {
  defaults: { savingsAccountCap: number };
  code: string;
}): SavingsAccount[] {
  // For non-CZK currencies, scale defaults proportionally vs CZK templates.
  if (spec.code === "CZK") return DEFAULT_ACCOUNTS;
  const cap = spec.defaults.savingsAccountCap;
  return [
    {
      id: "bank_a",
      name: "Bank A",
      rateBelowPct: 4.0,
      cap,
      rateAbovePct: 0.5,
    },
    {
      id: "bank_b",
      name: "Bank B",
      rateBelowPct: 3.75,
      cap: cap * 2,
      rateAbovePct: 1.0,
    },
    {
      id: "bank_c",
      name: "Bank C",
      rateBelowPct: 4.5,
      cap: Math.round(cap * 1.2),
      rateAbovePct: 1.5,
    },
  ];
}

export function SavingsCalculator() {
  const { t, fmtMoney, fmtPct, spec } = useI18n();
  const d = spec.defaults;

  const [totalAmount, setTotalAmount] = useState(d.savingsTotal);
  const [monthly, setMonthly] = useState(d.savingsMonthly);
  const [years, setYears] = useState(5);
  const [taxPct, setTaxPct] = useState(15);
  const [accounts, setAccounts] = useState<SavingsAccount[]>(() =>
    makeDefaultAccounts(spec),
  );

  // Reset money inputs and account caps when currency changes.
  useEffect(() => {
    setTotalAmount(d.savingsTotal);
    setMonthly(d.savingsMonthly);
    setAccounts(makeDefaultAccounts(spec));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.code]);

  const months = years * 12;
  const result = useMemo(
    () =>
      calcSavingsOptimized({
        totalAmount,
        monthlyDeposit: monthly,
        months,
        taxPct,
        accounts,
      }),
    [totalAmount, monthly, months, taxPct, accounts],
  );

  const chartData = useMemo(() => {
    const points: Record<string, number | string>[] = [];
    const step = Math.max(1, Math.floor(months / 60));
    for (let m = step; m <= months; m += step) {
      const row: Record<string, number | string> = { month: m };
      let total = 0;
      for (const a of accounts) {
        const sched = result.perAccountSchedule[a.id]?.[m - 1];
        const v = sched ? Math.round(sched.balance) : 0;
        row[a.id] = v;
        total += v;
      }
      row.total = total;
      points.push(row);
    }
    return points;
  }, [result, accounts, months]);

  const updateAcc = (id: string, patch: Partial<SavingsAccount>) =>
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const addAcc = () =>
    setAccounts((prev) => [
      ...prev,
      {
        id: `acc_${Date.now()}`,
        name: `${t("savings.account.new")} ${prev.length + 1}`,
        rateBelowPct: 4,
        cap: d.savingsAccountCap,
        rateAbovePct: 0.5,
      },
    ]);
  const removeAcc = (id: string) =>
    setAccounts((prev) => (prev.length > 1 ? prev.filter((a) => a.id !== id) : prev));

  const overflow =
    result.allocations.reduce((s, a) => s + a.amount, 0) < totalAmount - 0.5;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Panel title={t("common.inputs")} description={t("savings.inputs.desc")}>
          <div className="space-y-5">
            <SliderField
              label={t("savings.totalAmount")}
              value={totalAmount}
              onChange={setTotalAmount}
              min={0}
              max={spec.bigCap}
              step={spec.bigStep}
              format={(v) => fmtMoney(v)}
            />
            <SliderField
              label={t("savings.monthly")}
              value={monthly}
              onChange={setMonthly}
              min={0}
              max={spec.smallCap}
              step={spec.smallStep}
              format={(v) => fmtMoney(v)}
            />
            <SliderField
              label={t("savings.duration")}
              value={years}
              onChange={setYears}
              min={1}
              max={30}
              unit={t("common.years")}
            />
            <SliderField
              label={t("savings.tax")}
              value={taxPct}
              onChange={setTaxPct}
              min={0}
              max={35}
              step={1}
              unit={t("common.percent")}
            />
          </div>
        </Panel>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label={t("savings.stat.final")}
              value={fmtMoney(result.totalFinal)}
              hint={`${t("savings.stat.final.hint")} ${fmtMoney(result.totalDeposited)}`}
              accent="primary"
            />
            <StatCard
              label={t("savings.stat.interest")}
              value={fmtMoney(result.totalInterest)}
              hint={`${t("savings.stat.interest.hint")} ${fmtPct(result.effectiveAnnualPct, 2)} p.a.`}
              accent="success"
            />
            <StatCard
              label={t("savings.stat.weighted")}
              value={fmtPct(result.weightedRatePct, 2)}
              hint={t("savings.stat.weighted.hint")}
              icon={<Sparkles className="size-4" />}
            />
          </div>

          <Panel
            title={t("savings.alloc.title")}
            description={t("savings.alloc.desc")}
          >
            <div className="space-y-2">
              {result.allocations.map((a, i) => {
                const pct = totalAmount > 0 ? (a.amount / totalAmount) * 100 : 0;
                return (
                  <div
                    key={a.accountId}
                    className="rounded-xl border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <span className="truncate text-sm font-medium">{a.accountName}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular">
                          {fmtMoney(a.amount)}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular">
                          {pct.toFixed(1)} % · {fmtPct(a.blendedRatePct, 2)} p.a.
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground tabular">
                      {t("savings.alloc.row.interest")} {fmtMoney(a.monthlyInterestNet)}{" "}
                      {t("savings.alloc.row.perMonth")} ·{" "}
                      {fmtMoney(a.annualInterestNet)} {t("savings.alloc.row.perYear")}
                      {taxPct > 0 ? ` ${t("savings.alloc.row.afterTax")}` : ""}
                    </p>
                  </div>
                );
              })}
              {overflow && (
                <p className="rounded-lg bg-warning/10 p-2 text-xs text-warning-foreground">
                  {t("savings.alloc.overflow")}
                </p>
              )}
            </div>
          </Panel>

          <Panel title={t("savings.chart.title")} description={t("savings.chart.desc")}>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-muted-foreground)"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(m) => `${Math.round(m / 12)}${t("common.year.short")}`}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1_000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => fmtMoney(v)}
                    labelFormatter={(l) => `${t("mortgage.chart.monthLabel")} ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {accounts.map((a, i) => (
                    <Line
                      key={a.id}
                      type="monotone"
                      dataKey={a.id}
                      name={a.name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title={t("savings.accounts.title")}
        description={t("savings.accounts.desc")}
        action={
          <Button size="sm" variant="outline" onClick={addAcc}>
            <Plus className="size-4" /> {t("savings.accounts.add")}
          </Button>
        }
      >
        <div className="space-y-3">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="grid gap-3 rounded-xl border border-border bg-secondary/30 p-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-end"
            >
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t("savings.account.name")}
                </Label>
                <Input
                  value={a.name}
                  onChange={(e) => updateAcc(a.id, { name: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t("savings.account.rateBelow")}
                </Label>
                <NumberField
                  value={a.rateBelowPct}
                  onChange={(v) => updateAcc(a.id, { rateBelowPct: v })}
                  min={0}
                  max={20}
                  step={0.05}
                  decimals={2}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t("savings.account.cap")} ({spec.code})
                </Label>
                <NumberField
                  value={a.cap}
                  onChange={(v) => updateAcc(a.id, { cap: v })}
                  min={0}
                  max={spec.bigCap}
                  step={spec.midStep}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t("savings.account.rateAbove")}
                </Label>
                <NumberField
                  value={a.rateAbovePct}
                  onChange={(v) => updateAcc(a.id, { rateAbovePct: v })}
                  min={0}
                  max={20}
                  step={0.05}
                  decimals={2}
                  className="h-9"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAcc(a.id)}
                disabled={accounts.length <= 1}
                aria-label={t("common.delete")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
