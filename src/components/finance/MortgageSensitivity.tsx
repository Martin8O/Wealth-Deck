import { useMemo } from "react";
import { Panel } from "@/components/finance/Panel";
import { formatCZK } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

interface Props {
  loanAmount: number;
  interestRatePct: number;
  currentTermYears: number;
}

function pmt(loan: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
}

export function MortgageSensitivity({
  loanAmount,
  interestRatePct,
  currentTermYears,
}: Props) {
  const { rows, cols, table, min, max } = useMemo(() => {
    // Loan amount variants: -40% to +40% in 10% steps centered on current loan
    const base = Math.max(100_000, Math.round(loanAmount / 100_000) * 100_000);
    const loanRows: number[] = [];
    for (let pct = -40; pct <= 40; pct += 10) {
      loanRows.push(Math.round((base * (100 + pct)) / 100 / 50_000) * 50_000);
    }
    const termCols = [10, 15, 20, 25, 30, 35, 40];
    const matrix = loanRows.map((l) =>
      termCols.map((y) => pmt(l, interestRatePct, y)),
    );
    let mn = Infinity;
    let mx = -Infinity;
    matrix.forEach((row) =>
      row.forEach((v) => {
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }),
    );
    return { rows: loanRows, cols: termCols, table: matrix, min: mn, max: mx };
  }, [loanAmount, interestRatePct]);

  const intensity = (v: number) => (max === min ? 0 : (v - min) / (max - min));

  return (
    <Panel
      title="Citlivostní tabulka splátek"
      description={`Měsíční splátka pro různé výše úvěru a doby splácení (sazba ${interestRatePct.toFixed(2).replace(".", ",")} % p.a.)`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Úvěr ↓ / Doba →
              </th>
              {cols.map((c) => (
                <th
                  key={c}
                  className={cn(
                    "px-3 py-2 text-right text-xs font-medium text-muted-foreground",
                    c === currentTermYears && "text-primary",
                  )}
                >
                  {c} let
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((loan, i) => (
              <tr key={loan} className="border-t border-border">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-medium tabular text-muted-foreground"
                >
                  {formatCZK(loan)}
                </th>
                {cols.map((y, j) => {
                  const v = table[i][j];
                  const t = intensity(v);
                  const highlight =
                    Math.abs(loan - loanAmount) < 50_001 && y === currentTermYears;
                  return (
                    <td
                      key={y}
                      className={cn(
                        "px-3 py-2 text-right tabular transition-colors",
                        highlight
                          ? "bg-primary/15 font-semibold text-primary ring-1 ring-inset ring-primary/40"
                          : "",
                      )}
                      style={
                        highlight
                          ? undefined
                          : {
                              backgroundColor: `color-mix(in oklab, var(--color-warning) ${(t * 18).toFixed(1)}%, transparent)`,
                            }
                      }
                    >
                      {formatCZK(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Zvýrazněná buňka odpovídá vaší aktuální konfiguraci. Sytější odstín = vyšší
        měsíční splátka.
      </p>
    </Panel>
  );
}
