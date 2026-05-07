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
  Heart,
} from "lucide-react";
import { ThemeToggle } from "@/components/finance/ThemeToggle";
import { LangToggle } from "@/components/finance/LangToggle";
import { CurrencyToggle } from "@/components/finance/CurrencyToggle";
import { SaveLoadButtons } from "@/components/finance/SaveLoadButtons";
import { AboutButton } from "@/components/finance/AboutButton";
import { PensionCalculator } from "@/components/calculators/PensionCalculator";
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";
import { SavingsCalculator } from "@/components/calculators/SavingsCalculator";
import { InvestmentCalculator } from "@/components/calculators/InvestmentCalculator";
import { YieldSimulator } from "@/components/calculators/YieldSimulator";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Financial Calculators — retirement, mortgage, savings, investments" },
      {
        name: "description",
        content:
          "Five professional financial calculators in one place: retirement, mortgage, savings comparison, investment portfolio with dividends and a flexible yield simulator. Multi-currency, EN/CZ.",
      },
      { property: "og:title", content: "Financial Calculators" },
      {
        property: "og:description",
        content:
          "Five professional financial calculators in one place — retirement, mortgage, savings and investments.",
      },
    ],
  }),
  component: Home_,
});

type CalcKey = "pension" | "mortgage" | "savings" | "investment" | "yield";

interface Calc {
  key: CalcKey;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const CALCULATORS: Calc[] = [
  { key: "pension", icon: PiggyBank, accent: "from-chart-1/20 to-chart-2/10" },
  { key: "mortgage", icon: Home, accent: "from-chart-3/20 to-chart-1/10" },
  { key: "savings", icon: Wallet, accent: "from-chart-2/20 to-chart-4/10" },
  { key: "investment", icon: TrendingUp, accent: "from-chart-4/20 to-chart-1/10" },
  { key: "yield", icon: LineChart, accent: "from-chart-5/20 to-chart-3/10" },
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

function Switchers() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SaveLoadButtons />
      <LangToggle />
      <CurrencyToggle />
      <ThemeToggle />
    </div>
  );
}

function Home_() {
  const { t } = useI18n();
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
            <div className="flex items-center gap-2">
              <AboutButton />
              <button
                type="button"
                onClick={() => setActive(null)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
              >
                <ArrowLeft className="size-4" />
                {t("app.back")}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {activeCalc && (
                <span className="hidden text-sm font-medium text-foreground md:inline">
                  {t(`calc.${activeCalc.key}.title`)}
                </span>
              )}
            </div>
            <Switchers />
          </div>
        </div>
      )}

      {/* Hero / picker */}
      <header className="hero-bg">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 md:px-8 md:pt-16 md:pb-12">
          {!active && (
            <div className="flex items-center justify-between gap-2">
              <AboutButton />
              <Switchers />
            </div>
          )}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="size-3 text-primary" />
              {t("app.tagline")}
            </div>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {t("app.title.prefix")}{" "}
              <span className="text-primary">{t("app.title.highlight")}</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
              {t("app.subtitle")}
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
                    {t(`calc.${c.key}.subtitle`)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {t(`calc.${c.key}.title`)}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t(`calc.${c.key}.desc`)}
                  </p>
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
                    {t(`calc.${activeCalc.key}.subtitle`)}
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {t(`calc.${activeCalc.key}.title`)}
                  </h2>
                </div>
              </>
            )}
          </div>
          <CalculatorView k={active} />
        </section>
      )}

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} · {t("app.footer.disclaimer")}
        </p>
        <p className="mt-2 inline-flex items-center justify-center gap-1.5">
          {t("app.vibecoded")}{" "}
          <a
            href="https://github.com/Martin8O"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Martin
          </a>{" "}
          {t("app.with")}{" "}
          <a
            href="https://lovable.dev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            <Heart className="size-3 text-primary" /> Lovable
          </a>
        </p>
      </footer>
    </div>
  );
}
