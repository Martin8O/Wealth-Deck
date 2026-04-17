import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex w-full rounded-xl border border-border bg-secondary/40 p-1 backdrop-blur-sm",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-lg font-medium transition-all duration-200",
              size === "sm" ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
              active
                ? "bg-background text-foreground shadow-sm"
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
