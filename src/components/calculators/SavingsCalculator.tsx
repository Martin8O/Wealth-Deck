import { useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles } from "lucide-react";
import {
  calcSavingsOptimized,
  DEFAULT_ACCOUNTS,
  type SavingsAccount,
} from "@/lib/finance/savings";
import { formatCZK, formatPct } from "@/lib/finance/format";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function SavingsCalculator() {
  const [totalAmount, setTotalAmount] = useState(500_000);
  const [monthly, setMonthly] = useState(5_000);
  const [years, setYears] = useState(5);
  const [applyTax, setApplyTax] = useState(true);
  const [accounts, setAccounts] = useState<SavingsAccount[]>(DEFAULT_ACCOUNTS);

  const months = years * 12;
  const result = useMemo(
    () =>
      calcSavingsOptimized({
        totalAmount,
        monthlyDeposit: monthly,
        months,
        applyTax,
        accounts,
      }),
    [totalAmount, monthly, months, applyTax, accounts],
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
        name: `Účet ${prev.length + 1}`,
        rateBelowPct: 4,
        cap: 250_000,
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
        <Panel title="Vstupy" description="Optimalizujeme rozdělení mezi účty">
          <div className="space-y-5">
            <SliderField
              label="Celková částka k uložení"
              value={totalAmount}
              onChange={setTotalAmount}
              min={0}
              max={10_000_000}
              step={10_000}
              format={(v) => formatCZK(v)}
            />
            <SliderField
              label="Měsíční vklad"
              value={monthly}
              onChange={setMonthly}
              min={0}
              max={100_000}
              step={500}
              format={(v) => formatCZK(v)}
            />
            <SliderField
              label="Doba spoření"
              value={years}
              onChange={setYears}
              min={1}
              max={30}
              unit="let"
            />
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
              <Label className="text-sm">Srážková daň 15 %</Label>
              <Switch checked={applyTax} onCheckedChange={setApplyTax} />
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Konečný zůstatek"
              value={formatCZK(result.totalFinal)}
              hint={`Vloženo: ${formatCZK(result.totalDeposited)}`}
              accent="primary"
            />
            <StatCard
              label="Celkové úroky"
              value={formatCZK(result.totalInterest)}
              hint={`Efekt. ${formatPct(result.effectiveAnnualPct, 2)} p.a.`}
              accent="success"
            />
            <StatCard
              label="Vážená sazba (start)"
              value={formatPct(result.weightedRatePct, 2)}
              hint="Po optimálním rozdělení"
              icon={<Sparkles className="size-4" />}
            />
          </div>

          <Panel
            title="Optimální rozdělení"
            description="Greedy alokace podle nejvyšší sazby v daném pásmu"
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
                          {formatCZK(a.amount)}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular">
                          {pct.toFixed(1)} % · {formatPct(a.blendedRatePct, 2)} p.a.
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
                      Úrok ~ {formatCZK(a.monthlyInterestNet)} / měs · {" "}
                      {formatCZK(a.annualInterestNet)} / rok
                      {applyTax ? " (po dani)" : ""}
                    </p>
                  </div>
                );
              })}
              {overflow && (
                <p className="rounded-lg bg-warning/10 p-2 text-xs text-warning-foreground">
                  Pozn.: bez limitu nad cap žádný účet — část částky se nealokovala.
                  Nastavte sazbu „nad limit" alespoň jednomu účtu.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Vývoj zůstatku" description="Měsíc po měsíci">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-muted-foreground)"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(m) => `${Math.round(m / 12)}r`}
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
                    formatter={(v: number) => formatCZK(v)}
                    labelFormatter={(l) => `Měsíc ${l}`}
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
        title="Spořicí účty"
        description="Pásmo: do limitu sazba A, nad limit sazba B (% p.a.)"
        action={
          <Button size="sm" variant="outline" onClick={addAcc}>
            <Plus className="size-4" /> Přidat účet
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
                <Label className="text-xs text-muted-foreground">Název</Label>
                <Input
                  value={a.name}
                  onChange={(e) => updateAcc(a.id, { name: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sazba do limitu (%)</Label>
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
                <Label className="text-xs text-muted-foreground">Limit (CZK)</Label>
                <NumberField
                  value={a.cap}
                  onChange={(v) => updateAcc(a.id, { cap: v })}
                  min={0}
                  max={50_000_000}
                  step={10_000}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sazba nad limit (%)</Label>
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
                aria-label="Smazat"
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
