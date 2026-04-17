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
import { formatCZK, formatPct } from "@/lib/finance/format";

const newAsset = (idx: number): InvestmentAsset => ({
  id: `asset_${Date.now()}_${idx}`,
  name: `Aktivum ${idx}`,
  invested: 100_000,
  monthlyContribution: 2_000,
  returnMode: "percent",
  returnPct: 8,
  monthlyReturnCZK: 1_000,
  taxPct: 15,
  reinvest: true,
  paysDividends: false,
  dividendYieldPct: 4,
  dividendFrequency: "quarterly",
});

export function InvestmentCalculator() {
  const [horizonYears, setHorizonYears] = useState(15);
  const [inflation, setInflation] = useState(2.5);
  const [assets, setAssets] = useState<InvestmentAsset[]>([
    { ...newAsset(1), name: "ETF (akcie)" },
    {
      ...newAsset(2),
      name: "Dividendová akcie",
      invested: 50_000,
      monthlyContribution: 1_000,
      returnPct: 5,
      paysDividends: true,
      dividendYieldPct: 4.5,
      dividendFrequency: "quarterly",
    },
  ]);

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
  const add = () => setAssets((prev) => [...prev, newAsset(prev.length + 1)]);
  const remove = (id: string) =>
    setAssets((prev) => (prev.length > 1 ? prev.filter((a) => a.id !== id) : prev));

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
        <Panel title="Globální nastavení">
          <div className="space-y-5">
            <SliderField
              label="Investiční horizont"
              value={horizonYears}
              onChange={setHorizonYears}
              min={1}
              max={40}
              unit="let"
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
          </div>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Hodnota portfolia"
            value={formatCZK(result.totalFinalBalance)}
            hint={`Reálně: ${formatCZK(result.realFinalBalance)}`}
            accent="primary"
          />
          <StatCard
            label="Celkem vloženo"
            value={formatCZK(result.totalContributed)}
            hint={`Růst: ${formatCZK(result.totalGrowth)}`}
          />
          <StatCard
            label="Vážený výnos"
            value={formatPct(result.weightedYieldPct, 2)}
            hint="CAGR napříč aktivy"
            accent="success"
          />
          <StatCard
            label="Dividendy ročně"
            value={formatCZK(result.totalDividendsAnnual)}
            hint={`Ø měsíčně: ${formatCZK(result.averageMonthlyDividend)}`}
            accent="success"
            icon={<Coins className="size-4" />}
          />
        </div>
      </div>

      <Panel title="Vývoj portfolia">
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
                name="Celkem"
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
        title="Aktiva v portfoliu"
        action={
          <Button size="sm" variant="outline" onClick={add}>
            <Plus className="size-4" /> Přidat aktivum
          </Button>
        }
      >
        <div className="space-y-4">
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
                    disabled={assets.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SliderField
                    label="Počáteční investice"
                    value={a.invested}
                    onChange={(v) => update(a.id, { invested: v })}
                    min={0}
                    max={5_000_000}
                    step={10_000}
                    format={(v) => formatCZK(v)}
                  />
                  <SliderField
                    label="Měsíční příspěvek"
                    value={a.monthlyContribution}
                    onChange={(v) => update(a.id, { monthlyContribution: v })}
                    min={0}
                    max={50_000}
                    step={500}
                    format={(v) => formatCZK(v)}
                  />

                  {!a.paysDividends && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm">Typ výnosu</Label>
                        <SegmentedControl<ReturnMode>
                          value={a.returnMode}
                          onChange={(v) => update(a.id, { returnMode: v })}
                          options={[
                            { value: "percent", label: "% p.a." },
                            { value: "monthly_czk", label: "CZK/měs." },
                          ]}
                          size="sm"
                        />
                      </div>

                      {a.returnMode === "percent" ? (
                        <SliderField
                          label="Očekávaný výnos"
                          value={a.returnPct}
                          onChange={(v) => update(a.id, { returnPct: v })}
                          min={-5}
                          max={25}
                          step={0.1}
                          unit="% p.a."
                        />
                      ) : (
                        <SliderField
                          label="Měsíční výnos"
                          value={a.monthlyReturnCZK}
                          onChange={(v) => update(a.id, { monthlyReturnCZK: v })}
                          min={0}
                          max={50_000}
                          step={100}
                          format={(v) => formatCZK(v)}
                        />
                      )}
                    </>
                  )}

                  <SliderField
                    label="Daň z dividend"
                    value={a.taxPct}
                    onChange={(v) => update(a.id, { taxPct: v })}
                    min={0}
                    max={35}
                    step={1}
                    unit="%"
                  />
                </div>

                {/* Dividend block */}
                <div className="mt-4 rounded-xl border border-border bg-background/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="size-4 text-primary" />
                      <Label className="text-sm font-medium">Vyplácí dividendy?</Label>
                    </div>
                    <Switch
                      checked={a.paysDividends}
                      onCheckedChange={(v) => update(a.id, { paysDividends: v })}
                    />
                  </div>

                  {a.paysDividends && (
                    <div className="space-y-4">
                      <SliderField
                        label="Dividendový výnos"
                        value={a.dividendYieldPct}
                        onChange={(v) => update(a.id, { dividendYieldPct: v })}
                        min={0}
                        max={15}
                        step={0.1}
                        unit="% p.a."
                      />
                      <div className="space-y-2">
                        <Label className="text-sm">Frekvence výplaty</Label>
                        <FrequencyPicker
                          value={a.dividendFrequency}
                          onChange={(v: Frequency) =>
                            update(a.id, { dividendFrequency: v })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5">
                        <Label className="text-sm">Reinvestovat dividendy</Label>
                        <Switch
                          checked={a.reinvest}
                          onCheckedChange={(v) => update(a.id, { reinvest: v })}
                        />
                      </div>
                      {r && (
                        <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/40 p-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Dividendy ročně (po zdanění)</p>
                            <p className="mt-0.5 font-semibold tabular text-success">
                              {formatCZK(r.annualDividend)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ø měsíční cashflow</p>
                            <p className="mt-0.5 font-semibold tabular">
                              {formatCZK(r.averageMonthlyDividend)}
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
                      <p className="text-muted-foreground">Konečná hodnota</p>
                      <p className="font-semibold tabular">{formatCZK(r.finalBalance)}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Vloženo</p>
                      <p className="font-semibold tabular">{formatCZK(r.totalContributed)}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Růst</p>
                      <p className="font-semibold tabular text-success">
                        {formatCZK(r.totalGrowth)}
                      </p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">CAGR</p>
                      <p className="font-semibold tabular">{formatPct(r.effectiveAnnualPct, 2)}</p>
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
