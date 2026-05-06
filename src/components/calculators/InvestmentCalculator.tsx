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
import { SegmentedControl } from "@/components/finance/SegmentedControl";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Coins } from "lucide-react";
import {
  calcInvestment,
  type InvestmentAsset,
  type ReturnMode,
} from "@/lib/finance/investment";
import type { Frequency } from "@/lib/finance/frequency";
import { useI18n } from "@/lib/i18n/context";
import { usePersistentState } from "@/hooks/usePersistentState";

interface DefaultsLike {
  investmentInvested: number;
  investmentMonthly: number;
  investmentMonthlyReturn: number;
}

const newAsset = (idx: number, name: string, d: DefaultsLike): InvestmentAsset => ({
  id: `asset_${Date.now()}_${idx}`,
  name,
  invested: d.investmentInvested,
  monthlyContribution: d.investmentMonthly,
  returnMode: "percent",
  returnPct: 8,
  monthlyReturnCZK: d.investmentMonthlyReturn,
  taxPct: 15,
  reinvest: true,
  paysDividends: false,
  dividendYieldPct: 4,
  dividendFrequency: "quarterly",
});

export function InvestmentCalculator() {
  const { t, fmtMoney, fmtPct, spec } = useI18n();
  const d = spec.defaults;
  const ck = spec.code;

  const [horizonYears, setHorizonYears] = usePersistentState(`inv:${ck}:horizon`, 15);
  const [inflation, setInflation] = usePersistentState(`inv:${ck}:infl`, 2.5);
  const [assets, setAssets] = usePersistentState<InvestmentAsset[]>(`inv:${ck}:assets`, []);

  const result = useMemo(
    () =>
      calcInvestment({
        horizonMonths: horizonYears * 12,
        inflationPct: inflation,
        assets,
      }),
    [horizonYears, inflation, assets],
  );

  const update = (id: string, patch: Partial<InvestmentAsset>) =>
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const add = () =>
    setAssets((prev) => [
      ...prev,
      newAsset(prev.length + 1, `${t("investment.asset.new")} ${prev.length + 1}`, d),
    ]);
  const remove = (id: string) =>
    setAssets((prev) => prev.filter((a) => a.id !== id));

  const chartData = useMemo(() => {
    const months = horizonYears * 12;
    const step = Math.max(1, Math.floor(months / 80));
    const points: Record<string, number | string>[] = [];
    for (let m = step; m <= months; m += step) {
      const row: Record<string, number | string> = { month: m };
      let total = 0;
      result.perAsset.forEach((a) => {
        const v = a.schedule[m - 1]?.balance ?? 0;
        row[a.asset.id] = Math.round(v);
        total += v;
      });
      row.total = Math.round(total);
      points.push(row);
    }
    return points;
  }, [result, horizonYears]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Panel title={t("investment.global.title")}>
          <div className="space-y-5">
            <SliderField
              label={t("investment.horizon")}
              value={horizonYears}
              onChange={setHorizonYears}
              min={1}
              max={40}
              unit={t("common.years")}
            />
            <SliderField
              label={t("investment.inflation")}
              value={inflation}
              onChange={setInflation}
              min={0}
              max={10}
              step={0.1}
              unit={t("common.percent.pa")}
            />
          </div>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("investment.stat.portfolio")}
            value={fmtMoney(result.totalFinalBalance)}
            hint={`${t("investment.stat.portfolio.hint")} ${fmtMoney(result.realFinalBalance)}`}
            accent="primary"
          />
          <StatCard
            label={t("investment.stat.contributed")}
            value={fmtMoney(result.totalContributed)}
            hint={`${t("investment.stat.contributed.hint")} ${fmtMoney(result.totalGrowth)}`}
          />
          <StatCard
            label={t("investment.stat.weightedYield")}
            value={fmtPct(result.weightedYieldPct, 2)}
            hint={t("investment.stat.weightedYield.hint")}
            accent="success"
          />
          <StatCard
            label={t("investment.stat.dividends")}
            value={fmtMoney(result.totalDividendsAnnual)}
            hint={`${t("investment.stat.dividends.hint")} ${fmtMoney(result.averageMonthlyDividend)}`}
            accent="success"
            icon={<Coins className="size-4" />}
          />
        </div>
      </div>

      <Panel title={t("investment.chart.title")}>
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="invTotal" x1="0" y1="0" x2="0" y2="1">
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
                name={t("investment.chart.total")}
                type="monotone"
                dataKey="total"
                stroke="var(--color-chart-1)"
                fill="url(#invTotal)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title={t("investment.assets.title")}
        action={
          <Button size="sm" variant="outline" onClick={add}>
            <Plus className="size-4" /> {t("investment.assets.add")}
          </Button>
        }
      >
        <div className="space-y-4">
          {assets.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center text-sm text-muted-foreground">
              {t("investment.assets.empty")}
            </div>
          )}
          {assets.map((a, idx) => {
            const r = result.perAsset[idx];
            return (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-secondary/30 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <Input
                    value={a.name}
                    onChange={(e) => update(a.id, { name: e.target.value })}
                    className="h-9 max-w-xs font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(a.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SliderField
                    label={t("investment.asset.invested")}
                    value={a.invested}
                    onChange={(v) => update(a.id, { invested: v })}
                    min={0}
                    max={spec.midCap}
                    step={spec.midStep}
                    format={(v) => fmtMoney(v)}
                  />
                  <SliderField
                    label={t("investment.asset.monthly")}
                    value={a.monthlyContribution}
                    onChange={(v) => update(a.id, { monthlyContribution: v })}
                    min={0}
                    max={spec.smallCap}
                    step={spec.smallStep}
                    format={(v) => fmtMoney(v)}
                  />

                  {!a.paysDividends && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm">
                          {t("investment.asset.returnType")}
                        </Label>
                        <SegmentedControl<ReturnMode>
                          value={a.returnMode}
                          onChange={(v) => update(a.id, { returnMode: v })}
                          options={[
                            { value: "percent", label: t("investment.asset.modePercent") },
                            {
                              value: "monthly_czk",
                              label: `${spec.code} ${t("investment.asset.modeMonthly")}`,
                            },
                          ]}
                          size="sm"
                        />
                      </div>

                      {a.returnMode === "percent" ? (
                        <SliderField
                          label={t("investment.asset.returnPct")}
                          value={a.returnPct}
                          onChange={(v) => update(a.id, { returnPct: v })}
                          min={-5}
                          max={25}
                          step={0.1}
                          unit={t("common.percent.pa")}
                        />
                      ) : (
                        <SliderField
                          label={t("investment.asset.returnCzk")}
                          value={a.monthlyReturnCZK}
                          onChange={(v) => update(a.id, { monthlyReturnCZK: v })}
                          min={0}
                          max={spec.tinyCap}
                          step={spec.tinyStep}
                          format={(v) => fmtMoney(v)}
                        />
                      )}
                    </>
                  )}

                  <SliderField
                    label={t("investment.asset.tax")}
                    value={a.taxPct}
                    onChange={(v) => update(a.id, { taxPct: v })}
                    min={0}
                    max={35}
                    step={1}
                    unit={t("common.percent")}
                  />
                </div>

                <div className="mt-4 rounded-xl border border-border bg-background/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="size-4 text-primary" />
                      <Label className="text-sm font-medium">
                        {t("investment.asset.paysDividends")}
                      </Label>
                    </div>
                    <Switch
                      checked={a.paysDividends}
                      onCheckedChange={(v) => update(a.id, { paysDividends: v })}
                    />
                  </div>

                  {a.paysDividends && (
                    <div className="space-y-4">
                      <SliderField
                        label={t("investment.asset.dividendYield")}
                        value={a.dividendYieldPct}
                        onChange={(v) => update(a.id, { dividendYieldPct: v })}
                        min={0}
                        max={15}
                        step={0.1}
                        unit={t("common.percent.pa")}
                      />
                      <div className="space-y-2">
                        <Label className="text-sm">{t("common.frequency")}</Label>
                        <FrequencyPicker
                          value={a.dividendFrequency}
                          onChange={(v: Frequency) =>
                            update(a.id, { dividendFrequency: v })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5">
                        <Label className="text-sm">
                          {t("investment.asset.reinvest")}
                        </Label>
                        <Switch
                          checked={a.reinvest}
                          onCheckedChange={(v) => update(a.id, { reinvest: v })}
                        />
                      </div>
                      {r && (
                        <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/40 p-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">
                              {t("investment.asset.divAnnualNet")}
                            </p>
                            <p className="mt-0.5 font-semibold tabular text-success">
                              {fmtMoney(r.annualDividend)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("investment.asset.divAvgMonthly")}
                            </p>
                            <p className="mt-0.5 font-semibold tabular">
                              {fmtMoney(r.averageMonthlyDividend)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {r && (
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
                    <div className="text-xs">
                      <p className="text-muted-foreground">
                        {t("investment.asset.final")}
                      </p>
                      <p className="font-semibold tabular">{fmtMoney(r.finalBalance)}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">
                        {t("investment.asset.contributed")}
                      </p>
                      <p className="font-semibold tabular">
                        {fmtMoney(r.totalContributed)}
                      </p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">
                        {t("investment.asset.growth")}
                      </p>
                      <p className="font-semibold tabular text-success">
                        {fmtMoney(r.totalGrowth)}
                      </p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">
                        {t("investment.asset.cagr")}
                      </p>
                      <p className="font-semibold tabular">
                        {fmtPct(r.effectiveAnnualPct, 2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
