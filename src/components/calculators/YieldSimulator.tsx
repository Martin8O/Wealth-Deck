import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/finance/Panel";
import { SliderField } from "@/components/finance/SliderField";
import { StatCard } from "@/components/finance/StatCard";
import { FrequencyPicker } from "@/components/finance/FrequencyPicker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { calcYieldSim } from "@/lib/finance/yieldSim";
import type { Frequency } from "@/lib/finance/frequency";
import { formatCZK, formatPct } from "@/lib/finance/format";

export function YieldSimulator() {
  const [initial, setInitial] = useState(100_000);
  const [monthly, setMonthly] = useState(5_000);
  const [yieldPct, setYieldPct] = useState(8);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [years, setYears] = useState(10);
  const [tax, setTax] = useState(15);
  const [inflation, setInflation] = useState(2.5);
  const [reinvest, setReinvest] = useState(true);

  const result = useMemo(
    () =>
      calcYieldSim({
        initialInvestment: initial,
        monthlyContribution: monthly,
        yieldPct,
        payoutFrequency: frequency,
        horizonMonths: years * 12,
        taxPct: tax,
        inflationPct: inflation,
        reinvest,
      }),
    [initial, monthly, yieldPct, frequency, years, tax, inflation, reinvest],
  );

  const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(result.schedule.length / 80));
    return result.schedule
      .filter((_, i) => i % step === 0 || i === result.schedule.length - 1)
      .map((r) => ({
        month: r.month,
        balance: Math.round(r.balance),
        contributed: Math.round(r.contributed),
      }));
  }, [result.schedule]);

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Panel title="Vstupy" description="Flexibilní simulátor výnosu">
        <div className="space-y-5">
          <SliderField
            label="Počáteční investice"
            value={initial}
            onChange={setInitial}
            min={0}
            max={10_000_000}
            step={10_000}
            format={(v) => formatCZK(v)}
          />
          <SliderField
            label="Měsíční příspěvek"
            value={monthly}
            onChange={setMonthly}
            min={0}
            max={100_000}
            step={500}
            format={(v) => formatCZK(v)}
          />
          <SliderField
            label="Výnos"
            value={yieldPct}
            onChange={setYieldPct}
            min={0}
            max={20}
            step={0.1}
            unit="% p.a."
          />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Frekvence výplaty</Label>
            <FrequencyPicker value={frequency} onChange={setFrequency} />
          </div>
          <SliderField
            label="Horizont"
            value={years}
            onChange={setYears}
            min={1}
            max={40}
            unit="let"
          />
          <SliderField
            label="Daň z výnosu"
            value={tax}
            onChange={setTax}
            min={0}
            max={35}
            step={1}
            unit="%"
          />
          <SliderField
            label="Inflace"
            value={inflation}
            onChange={setInflation}
            min={0}
            max={10}
            step={0.1}
            unit="% p.a."
          />
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
            <Label className="text-sm">Reinvestovat výnosy</Label>
            <Switch checked={reinvest} onCheckedChange={setReinvest} />
          </div>
        </div>
      </Panel>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Konečná hodnota"
            value={formatCZK(result.finalBalance)}
            hint={`Reálně: ${formatCZK(result.realFinalBalance)}`}
            accent="primary"
          />
          <StatCard
            label="Vloženo celkem"
            value={formatCZK(result.totalContributed)}
            hint={
              reinvest
                ? `Růst: ${formatCZK(result.finalBalance - result.totalContributed)}`
                : `Vyplaceno: ${formatCZK(result.totalPaidOut)}`
            }
          />
          <StatCard
            label="Výnosy po zdanění"
            value={formatCZK(result.totalYieldNet)}
            hint={`Hrubě: ${formatCZK(result.totalYieldGross)}`}
            accent="success"
          />
          <StatCard
            label="Efektivní výnos"
            value={formatPct(result.effectiveAfterTaxPct, 2)}
            hint={`Reálně: ${formatPct(result.effectiveRealPct, 2)}`}
            accent={result.effectiveRealPct > 0 ? "success" : "destructive"}
          />
        </div>

        <Panel title="Vývoj investice">
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="ysBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ysCon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
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
                <Area
                  name="Hodnota"
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-chart-1)"
                  fill="url(#ysBal)"
                  strokeWidth={2}
                />
                <Area
                  name="Vloženo"
                  type="monotone"
                  dataKey="contributed"
                  stroke="var(--color-chart-2)"
                  fill="url(#ysCon)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
