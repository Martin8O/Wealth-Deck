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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  calcSavings,
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
  const [initial, setInitial] = useState(100_000);
  const [monthly, setMonthly] = useState(5_000);
  const [years, setYears] = useState(5);
  const [applyTax, setApplyTax] = useState(true);
  const [accounts, setAccounts] = useState<SavingsAccount[]>(DEFAULT_ACCOUNTS);

  const months = years * 12;
  const results = useMemo(
    () =>
      calcSavings({
        initialDeposit: initial,
        monthlyDeposit: monthly,
        months,
        applyTax,
        accounts,
      }),
    [initial, monthly, months, applyTax, accounts],
  );

  const chartData = useMemo(() => {
    const points: Record<string, number | string>[] = [];
    const step = Math.max(1, Math.floor(months / 60));
    for (let m = step; m <= months; m += step) {
      const row: Record<string, number | string> = { month: m };
      results.forEach((r) => {
        const sched = r.schedule[m - 1];
        row[r.account.id] = sched ? Math.round(sched.balance) : 0;
      });
      points.push(row);
    }
    return points;
  }, [results, months]);

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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Panel title="Vstupy" description="Porovnejte spořicí účty">
          <div className="space-y-5">
            <SliderField
              label="Počáteční vklad"
              value={initial}
              onChange={setInitial}
              min={0}
              max={5_000_000}
              step={10_000}
              format={(v) => formatCZK(v)}
            />
            <SliderField
              label="Měsíční vklad"
              value={monthly}
              onChange={setMonthly}
              min={0}
              max={50_000}
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
            {results.map((r, i) => (
              <StatCard
                key={r.account.id}
                label={r.account.name}
                value={formatCZK(r.finalBalance)}
                hint={`Úrok: ${formatCZK(r.totalInterest)} · ${formatPct(r.effectiveAnnualPct, 2)} efekt.`}
                accent={i === 0 ? "primary" : "default"}
              />
            ))}
          </div>

          <Panel title="Vývoj zůstatku" description="Měsíc po měsíci">
            <div className="h-[320px]">
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
                  {results.map((r, i) => (
                    <Line
                      key={r.account.id}
                      type="monotone"
                      dataKey={r.account.id}
                      name={r.account.name}
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
        title="Účty a sazby"
        description="Pásmo: do limitu sazba A, nad limit sazba B"
        action={
          <Button size="sm" variant="outline" onClick={addAcc}>
            <Plus className="size-4" /> Přidat
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
                <Label className="text-xs text-muted-foreground">Sazba do limitu</Label>
                <Input
                  type="number"
                  step="0.05"
                  value={a.rateBelowPct}
                  onChange={(e) => updateAcc(a.id, { rateBelowPct: Number(e.target.value) })}
                  className="h-9 text-right tabular"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Limit (CZK)</Label>
                <Input
                  type="number"
                  step="10000"
                  value={a.cap}
                  onChange={(e) => updateAcc(a.id, { cap: Number(e.target.value) })}
                  className="h-9 text-right tabular"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sazba nad limit</Label>
                <Input
                  type="number"
                  step="0.05"
                  value={a.rateAbovePct}
                  onChange={(e) => updateAcc(a.id, { rateAbovePct: Number(e.target.value) })}
                  className="h-9 text-right tabular"
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
