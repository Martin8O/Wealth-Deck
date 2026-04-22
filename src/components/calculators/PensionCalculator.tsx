import { useEffect, useMemo, useState } from "react";
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
import { useI18n } from "@/lib/i18n/context";
import { AlertTriangle } from "lucide-react";

export function PensionCalculator() {
  const { t, fmtMoney, spec } = useI18n();
  const d = spec.defaults;

  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentSavings, setCurrentSavings] = useState(d.pensionSavings);
  const [monthlyContribution, setMonthlyContribution] = useState(d.pensionMonthly);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [inflation, setInflation] = useState(2.5);
  const [desiredPension, setDesiredPension] = useState(d.pensionDesired);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);

  // When currency changes, reset money inputs to that currency's defaults so
  // values stay sensible (no FX conversion is performed).
  useEffect(() => {
    setCurrentSavings(d.pensionSavings);
    setMonthlyContribution(d.pensionMonthly);
    setDesiredPension(d.pensionDesired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.code]);

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
      <Panel title={t("common.inputs")} description={t("pension.inputs.desc")}>
        <div className="space-y-5">
          <SliderField
            label={t("pension.currentAge")}
            value={currentAge}
            onChange={setCurrentAge}
            min={18}
            max={70}
            unit={t("common.years")}
          />
          <SliderField
            label={t("pension.retirementAge")}
            value={retirementAge}
            onChange={setRetirementAge}
            min={Math.max(currentAge + 1, 50)}
            max={75}
            unit={t("common.years")}
          />
          <SliderField
            label={t("pension.currentSavings")}
            value={currentSavings}
            onChange={setCurrentSavings}
            min={0}
            max={d.midCap ?? spec.midCap}
            step={spec.midStep}
            format={(v) => fmtMoney(v)}
          />
          <SliderField
            label={t("pension.monthlyContribution")}
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            min={0}
            max={spec.smallCap}
            step={spec.smallStep}
            format={(v) => fmtMoney(v)}
          />
          <SliderField
            label={t("pension.expectedReturn")}
            value={expectedReturn}
            onChange={setExpectedReturn}
            min={0}
            max={15}
            step={0.1}
            unit={t("common.percent.pa")}
          />
          <SliderField
            label={t("pension.inflation")}
            value={inflation}
            onChange={setInflation}
            min={0}
            max={10}
            step={0.1}
            unit={t("common.percent.pa")}
          />
          <SliderField
            label={t("pension.desiredPension")}
            value={desiredPension}
            onChange={setDesiredPension}
            min={0}
            max={spec.smallCap * 2}
            step={spec.smallStep * 2}
            format={(v) => fmtMoney(v)}
          />
          <SliderField
            label={t("pension.lifeExpectancy")}
            value={lifeExpectancy}
            onChange={setLifeExpectancy}
            min={Math.max(retirementAge + 1, 70)}
            max={105}
            unit={t("common.years")}
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
            label={t("pension.stat.pot")}
            value={fmtMoney(result.potAtRetirement)}
            hint={`${t("pension.stat.pot.hint")} ${fmtMoney(result.potAtRetirementReal)}`}
            accent="primary"
          />
          <StatCard
            label={t("pension.stat.sustainable")}
            value={fmtMoney(result.sustainableMonthlyReal)}
            hint={t("pension.stat.sustainable.hint")}
          />
          <StatCard
            label={t("pension.stat.target")}
            value={fmtMoney(desiredPension)}
            hint={`${t("pension.stat.target.hint")} ${fmtMoney(result.desiredMonthlyAtRetirementNominal)}`}
          />
          <StatCard
            label={gap >= 0 ? t("pension.stat.surplus") : t("pension.stat.deficit")}
            value={fmtMoney(Math.abs(gap))}
            accent={gap >= 0 ? "success" : "destructive"}
            hint={t("pension.stat.gap.hint")}
          />
        </div>

        <Panel title={t("pension.chart.title")} description={t("pension.chart.desc")}>
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
                  formatter={(v: number) => fmtMoney(v)}
                  labelFormatter={(l) => `${t("pension.chart.ageLabel")} ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  name={t("pension.chart.nominal")}
                  type="monotone"
                  dataKey="nominal"
                  stroke="var(--color-chart-1)"
                  fill="url(#pensionNom)"
                  strokeWidth={2}
                />
                <Area
                  name={t("pension.chart.real")}
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
