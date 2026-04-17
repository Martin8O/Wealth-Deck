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
import { calcPension } from "@/lib/finance/pension";
import { formatCZK } from "@/lib/finance/format";
import { AlertTriangle } from "lucide-react";

export function PensionCalculator() {
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentSavings, setCurrentSavings] = useState(200_000);
  const [monthlyContribution, setMonthlyContribution] = useState(5_000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [inflation, setInflation] = useState(2.5);
  const [desiredPension, setDesiredPension] = useState(30_000);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);

  const result = useMemo(
    () =>
      calcPension({
        currentAge,
        retirementAge,
        currentSavings,
        monthlyContribution,
        expectedReturnPct: expectedReturn,
        inflationPct: inflation,
        desiredMonthlyPensionToday: desiredPension,
        lifeExpectancy,
      }),
    [
      currentAge,
      retirementAge,
      currentSavings,
      monthlyContribution,
      expectedReturn,
      inflation,
      desiredPension,
      lifeExpectancy,
    ],
  );

  const chartData = result.schedule.map((r) => ({
    age: r.age,
    nominal: Math.round(r.nominalBalance),
    real: Math.round(r.realBalance),
  }));

  const gap = result.gapMonthlyReal;

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Panel title="Vstupy" description="Plánujte si svůj důchod">
        <div className="space-y-5">
          <SliderField
            label="Aktuální věk"
            value={currentAge}
            onChange={setCurrentAge}
            min={18}
            max={70}
            unit="let"
          />
          <SliderField
            label="Věk odchodu do důchodu"
            value={retirementAge}
            onChange={setRetirementAge}
            min={Math.max(currentAge + 1, 50)}
            max={75}
            unit="let"
          />
          <SliderField
            label="Aktuální úspory"
            value={currentSavings}
            onChange={setCurrentSavings}
            min={0}
            max={5_000_000}
            step={10_000}
            format={(v) => formatCZK(v)}
          />
          <SliderField
            label="Měsíční příspěvek"
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            min={0}
            max={50_000}
            step={500}
            format={(v) => formatCZK(v)}
          />
          <SliderField
            label="Očekávaný výnos"
            value={expectedReturn}
            onChange={setExpectedReturn}
            min={0}
            max={15}
            step={0.1}
            unit="% p.a."
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
          <SliderField
            label="Požadovaný důchod (dnes)"
            value={desiredPension}
            onChange={setDesiredPension}
            min={0}
            max={100_000}
            step={1_000}
            format={(v) => formatCZK(v)}
          />
          <SliderField
            label="Doba dožití"
            value={lifeExpectancy}
            onChange={setLifeExpectancy}
            min={Math.max(retirementAge + 1, 70)}
            max={105}
            unit="let"
          />
        </div>
      </Panel>

      <div className="space-y-6">
        {result.warnings.length > 0 && (
          <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <ul className="space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Kapitál v důchodu"
            value={formatCZK(result.potAtRetirement)}
            hint={`Reálně: ${formatCZK(result.potAtRetirementReal)}`}
            accent="primary"
          />
          <StatCard
            label="Udržitelný měsíční výběr"
            value={formatCZK(result.sustainableMonthlyReal)}
            hint="V dnešních cenách"
          />
          <StatCard
            label="Cíl měsíčně"
            value={formatCZK(desiredPension)}
            hint={`Nominálně v důchodu: ${formatCZK(result.desiredMonthlyAtRetirementNominal)}`}
          />
          <StatCard
            label={gap >= 0 ? "Přebytek vs. cíl" : "Schodek vs. cíl"}
            value={formatCZK(Math.abs(gap))}
            accent={gap >= 0 ? "success" : "destructive"}
            hint="Měsíčně, dnešní hodnota"
          />
        </div>

        <Panel title="Vývoj kapitálu" description="Nominální vs. reálná hodnota">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="pensionNom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pensionReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="age" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
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
                  labelFormatter={(l) => `Věk ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  name="Nominálně"
                  type="monotone"
                  dataKey="nominal"
                  stroke="var(--color-chart-1)"
                  fill="url(#pensionNom)"
                  strokeWidth={2}
                />
                <Area
                  name="Reálně (dnes)"
                  type="monotone"
                  dataKey="real"
                  stroke="var(--color-chart-2)"
                  fill="url(#pensionReal)"
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
