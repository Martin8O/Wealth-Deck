import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  PiggyBank,
  Home,
  Wallet,
  TrendingUp,
  LineChart,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/finance/ThemeToggle";
import { PensionCalculator } from "@/components/calculators/PensionCalculator";
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";
import { SavingsCalculator } from "@/components/calculators/SavingsCalculator";
import { InvestmentCalculator } from "@/components/calculators/InvestmentCalculator";
import { YieldSimulator } from "@/components/calculators/YieldSimulator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finanční Kalkulátory — důchod, hypotéka, spoření, investice" },
      {
        name: "description",
        content:
          "Sjednocené finanční kalkulátory v češtině: důchodová kalkulačka, hypoteční simulátor, spořicí účty, investiční portfolio s dividendami a flexibilní výnosový simulátor.",
      },
      { property: "og:title", content: "Finanční Kalkulátory" },
      {
        property: "og:description",
        content:
          "Pět profesionálních finančních kalkulátorů na jednom místě — důchod, hypotéka, spoření a investice.",
      },
    ],
  }),
  component: Home_,
});

type CalcKey = "pension" | "mortgage" | "savings" | "investment" | "yield";

interface Calc {
  key: CalcKey;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind gradient classes
}

const CALCULATORS: Calc[] = [
  {
    key: "pension",
    title: "Důchodová kalkulačka",
    subtitle: "Plán na důchod",
    description: "Spočítejte si, kolik měsíčně bude váš důchod stačit, a kolik si je třeba spořit.",
    icon: PiggyBank,
    accent: "from-chart-1/20 to-chart-2/10",
  },
  {
    key: "mortgage",
    title: "Hypoteční simulátor",
    subtitle: "Hypotéka & splátky",
    description: "Modelujte měsíční splátku, úrok, mimořádné splátky a celkové náklady.",
    icon: Home,
    accent: "from-chart-3/20 to-chart-1/10",
  },
  {
    key: "savings",
    title: "Spořicí účty",
    subtitle: "Porovnání bank",
    description: "Porovnejte výnos spořicích účtů s pásmovými sazbami a daní z úroků.",
    icon: Wallet,
    accent: "from-chart-2/20 to-chart-4/10",
  },
  {
    key: "investment",
    title: "Investiční simulátor",
    subtitle: "Portfolio & dividendy",
    description: "Více aktiv, dividendy s volitelnou frekvencí, reinvestice, vážený výnos.",
    icon: TrendingUp,
    accent: "from-chart-4/20 to-chart-1/10",
  },
  {
    key: "yield",
    title: "Flexibilní výnosy",
    subtitle: "STRC-style simulátor",
    description: "Vlastní výnos, frekvence výplaty, daně, inflace a reinvestice.",
    icon: LineChart,
    accent: "from-chart-5/20 to-chart-3/10",
  },
];

function CalculatorView({ k }: { k: CalcKey }) {
  switch (k) {
    case "pension":
      return <PensionCalculator />;
    case "mortgage":
      return <MortgageCalculator />;
    case "savings":
      return <SavingsCalculator />;
    case "investment":
      return <InvestmentCalculator />;
    case "yield":
      return <YieldSimulator />;
  }
}

function Home_() {
  const [active, setActive] = useState<CalcKey | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [active]);

  const activeCalc = CALCULATORS.find((c) => c.key === active);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar when calculator open */}
      {active && (
        <div className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
            <button
              type="button"
              onClick={() => setActive(null)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Zpět na výběr
            </button>
            <div className="flex items-center gap-2">
              {activeCalc && (
                <span className="hidden text-sm font-medium text-foreground md:inline">
                  {activeCalc.title}
                </span>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>
      )}

      {/* Hero / picker */}
      <header className="hero-bg">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 md:px-8 md:pt-16 md:pb-12">
          {!active && (
            <div className="flex justify-end">
              <ThemeToggle />
            </div>
          )}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="size-3 text-primary" />
              Sjednocené finanční nástroje
            </div>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Finanční <span className="text-primary">Kalkulátory</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
              Pět profesionálních kalkulátorů — důchod, hypotéka, spoření, investice
              a flexibilní výnosy. Vyberte si níže.
            </p>
          </div>
        </div>
      </header>

      {/* Cards grid */}
      <section className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((c) => {
            const Icon = c.icon;
            const isActive = c.key === active;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActive(isActive ? null : c.key)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]",
                  isActive
                    ? "border-primary/60 ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 -z-0 bg-gradient-to-br opacity-60 transition-opacity duration-200 group-hover:opacity-100",
                    c.accent,
                  )}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-background/70 text-primary shadow-sm backdrop-blur-sm">
                      <Icon className="size-5" />
                    </div>
                    <ChevronRight
                      className={cn(
                        "size-4 text-muted-foreground transition-transform duration-200",
                        isActive ? "rotate-90 text-primary" : "group-hover:translate-x-0.5",
                      )}
                    />
                  </div>
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {c.subtitle}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {c.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{c.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active calculator panel */}
      {active && (
        <section
          ref={panelRef}
          className="mx-auto max-w-7xl px-4 pb-16 pt-2 md:px-8"
        >
          <div className="mb-6 flex items-center gap-3">
            {activeCalc && (
              <>
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <activeCalc.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {activeCalc.subtitle}
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {activeCalc.title}
                  </h2>
                </div>
              </>
            )}
          </div>
          <CalculatorView k={active} />
        </section>
      )}

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Finanční Kalkulátory · Všechny výpočty mají
        orientační charakter.
      </footer>
    </div>
  );
}
