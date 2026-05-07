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
import { MortgageSensitivity } from "@/components/finance/MortgageSensitivity";
import { calcMortgage } from "@/lib/finance/mortgage";
import { useI18n } from "@/lib/i18n/context";
import { usePersistentState } from "@/hooks/usePersistentState";
import { AlertTriangle } from "lucide-react";

export function MortgageCalculator() {
  const { t, fmtMoney, fmtPct, fmtYears, spec } = useI18n();
  const d = spec.defaults;
  const ck = spec.code;

  const [price, setPrice] = usePersistentState(`mortgage:${ck}:price`, d.mortgagePrice);
  const [downPayment, setDownPayment] = usePersistentState(`mortgage:${ck}:down`, d.mortgageDown);
  const [years, setYears] = usePersistentState(`mortgage:${ck}:years`, 30);
  const [rate, setRate] = usePersistentState(`mortgage:${ck}:rate`, 5.2);
  const [extra, setExtra] = usePersistentState(`mortgage:${ck}:extra`, d.mortgageExtra);

  const result = useMemo(
    () =>
      calcMortgage({
        propertyPrice: price,
        downPayment,
        loanTermYears: years,
        interestRatePct: rate,
        extraMonthlyPayment: extra,
      }),
    [price, downPayment, years, rate, extra],
  );

  const chartData = useMemo(() => {
    const sched = result.schedule;
    if (sched.length === 0) return [];
    const points = sched
      .filter((r) => r.month % 12 === 0)
      .map((r) => ({
        year: r.month / 12,
        balance: Math.round(r.balance),
        interest: Math.round(r.interest),
        principal: Math.round(r.principal + r.extra),
      }));
    return points;
  }, [result.schedule]);

  const yearTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    const last = chartData[chartData.length - 1].year;
    const step = last <= 10 ? 1 : last <= 20 ? 2 : 5;
    const ticks: number[] = [];
    for (let y = step; y <= last; y += step) ticks.push(y);
    if (ticks[ticks.length - 1] !== last) ticks.push(last);
    return ticks;
  }, [chartData]);

  const downPct = price > 0 ? (downPayment / price) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <Panel title={t("common.inputs")} description={t("mortgage.inputs.desc")}>
        <div className="space-y-5">
          <SliderField
            label={t("mortgage.price")}
            value={price}
            onChange={(v) => {
              setPrice(v);
              if (downPayment > v) setDownPayment(v);
            }}
            min={spec.midStep * 5}
            max={spec.bigCap}
            step={spec.bigStep}
            format={(v) => fmtMoney(v)}
          />
          <SliderField
            label={`${t("mortgage.downPayment")} (${downPct.toFixed(0)} %)`}
            value={downPayment}
            onChange={setDownPayment}
            min={0}
            max={price}
            step={spec.midStep}
            format={(v) => fmtMoney(v)}
          />
          <SliderField
            label={t("mortgage.term")}
            value={years}
            onChange={setYears}
            min={5}
            max={40}
            unit={t("common.years")}
          />
          <SliderField
            label={t("mortgage.rate")}
            value={rate}
            onChange={setRate}
            min={1}
            max={12}
            step={0.05}
            unit={t("common.percent.pa")}
          />
          <SliderField
            label={t("mortgage.extra")}
            value={extra}
            onChange={setExtra}
            min={0}
            max={spec.smallCap}
            step={spec.smallStep}
            format={(v) => fmtMoney(v)}
          />
        </div>
      </Panel>

      <div className="space-y-6">
        {result.ltvWarning !== "ok" && (
          <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <span>
              LTV {fmtPct(result.ltv * 100, 1)} —{" "}
              {result.ltvWarning === "warn90"
                ? t("mortgage.warn.ltv90")
                : t("mortgage.warn.ltv80")}
            </span>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("mortgage.stat.payment")}
            value={fmtMoney(result.monthlyPayment)}
            hint={
              extra > 0
                ? `${t("mortgage.stat.payment.extra")} ${fmtMoney(result.monthlyTotal)}`
                : undefined
            }
            accent="primary"
          />
          <StatCard
            label={t("mortgage.stat.loan")}
            value={fmtMoney(result.loanAmount)}
            hint={`LTV ${fmtPct(result.ltv * 100, 1)}`}
          />
          <StatCard
            label={t("mortgage.stat.interest")}
            value={fmtMoney(result.totalInterest)}
            hint={`${t("mortgage.stat.interest.hint")} ${fmtMoney(result.totalPaid)}`}
            accent="warning"
          />
          <StatCard
            label={t("mortgage.stat.term")}
            value={fmtYears(result.monthsToPayoff)}
            hint={
              extra > 0 && result.monthsToPayoff < years * 12
                ? `${t("mortgage.stat.term.saved")} ${years * 12 - result.monthsToPayoff} ${t("common.month")}`
                : undefined
            }
            accent={extra > 0 && result.monthsToPayoff < years * 12 ? "success" : "default"}
          />
        </div>

        <Panel title={t("mortgage.chart.title")} description={t("mortgage.chart.desc")}>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="mBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
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
                  name={t("mortgage.chart.balance")}
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-chart-1)"
                  fill="url(#mBal)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <MortgageSensitivity
          loanAmount={result.loanAmount}
          interestRatePct={rate}
          currentTermYears={years}
        />
      </div>
    </div>
  );
}
