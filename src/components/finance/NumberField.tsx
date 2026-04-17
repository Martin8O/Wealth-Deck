import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel?: string;
  decimals?: number;
}

/** Input that displays numbers with Czech thousand separators (e.g. 1 200 000)
 *  while emitting clean numeric values to the parent. */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  className,
  ariaLabel,
  decimals = 0,
}: NumberFieldProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const formatted = React.useMemo(() => {
    if (!Number.isFinite(value)) return "";
    return value.toLocaleString("cs-CZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }, [value, decimals]);

  const display = editing ? draft : formatted;

  const commit = (raw: string) => {
    // Strip spaces and non-breaking spaces, accept comma as decimal separator
    const cleaned = raw.replace(/[\s\u00A0\u202F]/g, "").replace(",", ".");
    if (cleaned === "" || cleaned === "-") {
      onChange(min ?? 0);
      return;
    }
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return;
    let bounded = n;
    if (min !== undefined) bounded = Math.max(min, bounded);
    if (max !== undefined) bounded = Math.min(max, bounded);
    onChange(bounded);
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={display}
      aria-label={ariaLabel}
      onFocus={(e) => {
        setDraft(String(value));
        setEditing(true);
        // Select all for quick replacement
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        commit(draft);
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit(draft);
          setEditing(false);
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "ArrowUp" && step) {
          e.preventDefault();
          onChange(Math.min(max ?? Infinity, value + step));
        } else if (e.key === "ArrowDown" && step) {
          e.preventDefault();
          onChange(Math.max(min ?? -Infinity, value - step));
        }
      }}
      className={cn("text-right tabular", className)}
    />
  );
}
