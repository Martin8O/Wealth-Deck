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
import { MortgageSensitivity } from "@/components/finance/MortgageSensitivity";
import { calcMortgage } from "@/lib/finance/mortgage";
import { formatCZK, formatPct, formatYears } from "@/lib/finance/format";
import { AlertTriangle } from "lucide-react";

export function MortgageCalculator() {
  const [price, setPrice] = useState(6_000_000);
  const [downPayment, setDownPayment] = useState(1_200_000);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(5.2);
  const [extra, setExtra] = useState(0);

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
    // Sample to ~120 points
    const step = Math.max(1, Math.floor(result.schedule.length / 120));
    return result.schedule
      .filter((_, i) => i % step === 0 || i === result.schedule.length - 1)
      .map((r) => ({
        month: r.month,
        balance: Math.round(r.balance),
        interest: Math.round(r.interest),
        principal: Math.round(r.principal + r.extra),
      }));
  }, [result.schedule]);

  const downPct = price > 0 ? (downPayment / price) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Panel title="Vstupy" description="Vyhodnoťte si hypotéku">
        <div className="space-y-5">
          <SliderField
            label="Cena nemovitosti"
            value={price}
            onChange={(v) => {
              setPrice(v);
              if (downPayment > v) setDownPayment(v);
            }}
            min={500_000}
            max={30_000_000}
            step={50_000}
            format={(v) => formatCZK(v)}
          />
          <SliderField
            label={`Vlastní zdroje (${downPct.toFixed(0)} %)`}
            value={downPayment}
            onChange={setDownPayment}
            min={0}
            max={price}
            step={10_000}
            format={(v) => formatCZK(v)}
          />
          <SliderField
            label="Doba splácení"
            value={years}
            onChange={setYears}
            min={5}
            max={40}
            unit="let"
          />
          <SliderField
            label="Úroková sazba"
            value={rate}
            onChange={setRate}
            min={1}
            max={12}
            step={0.05}
            unit="% p.a."
          />
          <SliderField
            label="Mimořádná splátka měsíčně"
            value={extra}
            onChange={setExtra}
            min={0}
            max={50_000}
            step={500}
            format={(v) => formatCZK(v)}
          />
        </div>
      </Panel>

      <div className="space-y-6">
        {result.ltvWarning !== "ok" && (
          <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <span>
              LTV {formatPct(result.ltv * 100, 1)} —{" "}
              {result.ltvWarning === "warn90"
                ? "banky obvykle nepůjčí přes 90 %, případně s vyšším úrokem."
                : "očekávejte přirážku k úroku nad 80 % LTV."}
            </span>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Měsíční splátka"
            value={formatCZK(result.monthlyPayment)}
            hint={extra > 0 ? `Vč. mimoř.: ${formatCZK(result.monthlyTotal)}` : undefined}
            accent="primary"
          />
          <StatCard
            label="Výše úvěru"
            value={formatCZK(result.loanAmount)}
            hint={`LTV ${formatPct(result.ltv * 100, 1)}`}
          />
          <StatCard
            label="Celkem na úrocích"
            value={formatCZK(result.totalInterest)}
            hint={`Celkem zaplatíte: ${formatCZK(result.totalPaid)}`}
            accent="warning"
          />
          <StatCard
            label="Doba splácení"
            value={formatYears(result.monthsToPayoff)}
            hint={
              extra > 0 && result.monthsToPayoff < years * 12
                ? `Úspora ${years * 12 - result.monthsToPayoff} m.`
                : undefined
            }
            accent={extra > 0 && result.monthsToPayoff < years * 12 ? "success" : "default"}
          />
        </div>

        <Panel title="Splátkový kalendář" description="Vývoj zůstatku a podíl úroku">
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
                  name="Zůstatek úvěru"
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
