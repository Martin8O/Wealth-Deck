import { useMemo } from "react";
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
import { useI18n } from "@/lib/i18n/context";
import { usePersistentState } from "@/hooks/usePersistentState";

export function YieldSimulator() {
  const { t, fmtMoney, fmtPct, spec } = useI18n();
  const d = spec.defaults;
  const ck = spec.code;

  const [initial, setInitial] = usePersistentState(`yield:${ck}:initial`, d.yieldInitial);
  const [monthly, setMonthly] = usePersistentState(`yield:${ck}:monthly`, d.yieldMonthly);
  const [yieldPct, setYieldPct] = usePersistentState(`yield:${ck}:yield`, 8);
  const [frequency, setFrequency] = usePersistentState<Frequency>(`yield:${ck}:freq`, "monthly");
  const [years, setYears] = usePersistentState(`yield:${ck}:years`, 10);
  const [tax, setTax] = usePersistentState(`yield:${ck}:tax`, 15);
  const [inflation, setInflation] = usePersistentState(`yield:${ck}:infl`, 2.5);
  const [reinvest, setReinvest] = usePersistentState(`yield:${ck}:reinvest`, true);

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
      <Panel title={t("common.inputs")} description={t("yield.inputs.desc")}>
        <div className="space-y-5">
          <SliderField
            label={t("yield.initial")}
            value={initial}
            onChange={setInitial}
            min={0}
            max={spec.bigCap}
            step={spec.bigStep}
            format={(v) => fmtMoney(v)}
          />
          <SliderField
            label={t("yield.monthly")}
            value={monthly}
            onChange={setMonthly}
            min={0}
            max={spec.smallCap}
            step={spec.smallStep}
            format={(v) => fmtMoney(v)}
          />
          <SliderField
            label={t("yield.yield")}
            value={yieldPct}
            onChange={setYieldPct}
            min={0}
            max={20}
            step={0.1}
            unit={t("common.percent.pa")}
          />
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("common.frequency")}</Label>
            <FrequencyPicker value={frequency} onChange={setFrequency} />
          </div>
          <SliderField
            label={t("yield.horizon")}
            value={years}
            onChange={setYears}
            min={1}
            max={40}
            unit={t("common.years")}
          />
          <SliderField
            label={t("yield.tax")}
            value={tax}
            onChange={setTax}
            min={0}
            max={35}
            step={1}
            unit={t("common.percent")}
          />
          <SliderField
            label={t("yield.inflation")}
            value={inflation}
            onChange={setInflation}
            min={0}
            max={10}
            step={0.1}
            unit={t("common.percent.pa")}
          />
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
            <Label className="text-sm">{t("yield.reinvest")}</Label>
            <Switch checked={reinvest} onCheckedChange={setReinvest} />
          </div>
        </div>
      </Panel>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("yield.stat.final")}
            value={fmtMoney(result.finalBalance)}
            hint={`${t("yield.stat.final.hint")} ${fmtMoney(result.realFinalBalance)}`}
            accent="primary"
          />
          <StatCard
            label={t("yield.stat.contributed")}
            value={fmtMoney(result.totalContributed)}
            hint={
              reinvest
                ? `${t("yield.stat.growth")} ${fmtMoney(result.finalBalance - result.totalContributed)}`
                : `${t("yield.stat.paidOut")} ${fmtMoney(result.totalPaidOut)}`
            }
          />
          <StatCard
            label={t("yield.stat.netYield")}
            value={fmtMoney(result.totalYieldNet)}
            hint={`${t("yield.stat.grossYield")} ${fmtMoney(result.totalYieldGross)}`}
            accent="success"
          />
          <StatCard
            label={t("yield.stat.effective")}
            value={fmtPct(result.effectiveAfterTaxPct, 2)}
            hint={`${t("yield.stat.effective.hint")} ${fmtPct(result.effectiveRealPct, 2)}`}
            accent={result.effectiveRealPct > 0 ? "success" : "destructive"}
          />
        </div>

        <Panel title={t("yield.chart.title")}>
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
                  tickFormatter={(m) => `${Math.round(m / 12)}${t("common.year.short")}`}
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
                  formatter={(v: number) => fmtMoney(v)}
                  labelFormatter={(l) => `${t("mortgage.chart.monthLabel")} ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  name={t("yield.chart.value")}
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-chart-1)"
                  fill="url(#ysBal)"
                  strokeWidth={2}
                />
                <Area
                  name={t("yield.chart.contributed")}
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
