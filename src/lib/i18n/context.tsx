import * as React from "react";
import { translate, type Lang } from "./translations";
import { getCurrency, type CurrencyCode, type CurrencySpec } from "./currency";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  spec: CurrencySpec;
  /** Translate a key. */
  t: (key: string) => string;
  /** Format an amount in the active currency, no decimals. */
  fmtMoney: (n: number, decimals?: number) => string;
  /** Format a plain number using the active locale. */
  fmtNum: (n: number, decimals?: number) => string;
  /** Format a value already in % using the active locale. */
  fmtPct: (n: number, decimals?: number) => string;
  /** Format months as a human-readable years/months string. */
  fmtYears: (months: number) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

const LS_LANG = "fin-lang";
const LS_CURRENCY = "fin-currency";

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(LS_LANG);
  return v === "cs" || v === "en" ? v : "en";
}
function readCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  const v = window.localStorage.getItem(LS_CURRENCY);
  return v === "USD" || v === "EUR" || v === "CZK" ? v : "USD";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");
  const [currency, setCurrencyState] = React.useState<CurrencyCode>("USD");

  React.useEffect(() => {
    setLangState(readLang());
    setCurrencyState(readCurrency());
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(LS_LANG, l);
  }, []);
  const setCurrency = React.useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") window.localStorage.setItem(LS_CURRENCY, c);
  }, []);

  const value = React.useMemo<I18nContextValue>(() => {
    const spec = getCurrency(currency);
    const moneyFmt = new Intl.NumberFormat(spec.locale, {
      style: "currency",
      currency: spec.code,
      maximumFractionDigits: 0,
    });
    const moneyFmt2 = new Intl.NumberFormat(spec.locale, {
      style: "currency",
      currency: spec.code,
      maximumFractionDigits: 2,
    });
    const numFmt = new Intl.NumberFormat(spec.locale, { maximumFractionDigits: 0 });
    const numFmt2 = new Intl.NumberFormat(spec.locale, { maximumFractionDigits: 2 });

    return {
      lang,
      setLang,
      currency,
      setCurrency,
      spec,
      t: (key: string) => translate(lang, key),
      fmtMoney: (n: number, decimals = 0) => {
        if (!Number.isFinite(n)) return "—";
        const out =
          decimals > 0 ? moneyFmt2.format(n) : moneyFmt.format(Math.round(n));
        // Keep digit groups unbreakable (NBSP between thousands), but allow
        // a line break right before the currency symbol/code by using a
        // regular space there. Intl uses NBSP (\u00A0) and NNBSP (\u202F)
        // between groups AND before the symbol — convert only the LAST one.
        return out.replace(/[\u00A0\u202F](?=\D*$)/, " ");
      },
      fmtNum: (n: number, decimals = 0) => {
        if (!Number.isFinite(n)) return "—";
        return decimals > 0 ? numFmt2.format(n) : numFmt.format(Math.round(n));
      },
      fmtPct: (n: number, decimals = 2) => {
        if (!Number.isFinite(n)) return "—";
        return `${n.toLocaleString(spec.locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })} %`;
      },
      fmtYears: (months: number) => {
        if (!Number.isFinite(months)) return "—";
        const y = Math.floor(months / 12);
        const m = Math.round(months - y * 12);
        const monthLbl = translate(lang, "common.month.short");
        const yearLbl = translate(lang, "common.year.short");
        if (y === 0) return `${m} ${monthLbl}`;
        if (m === 0) return `${y} ${yearLbl}`;
        return `${y} ${yearLbl} ${m} ${monthLbl}`;
      },
    };
  }, [lang, currency, setLang, setCurrency]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
