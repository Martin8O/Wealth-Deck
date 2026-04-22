import { useI18n } from "@/lib/i18n/context";
import { LANG_OPTIONS } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="radiogroup"
      aria-label={t("app.lang.toggle")}
      className="inline-flex h-9 items-center rounded-full border border-border bg-card p-0.5"
    >
      {LANG_OPTIONS.map((o) => {
        const active = lang === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLang(o.value)}
            className={cn(
              "h-8 rounded-full px-2.5 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
