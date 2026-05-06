import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
  icon?: React.ReactNode;
}

const accentMap = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const;

export function StatCard({
  label,
  value,
  hint,
  accent = "default",
  className,
  icon,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && <div className="text-muted-foreground/60">{icon}</div>}
      </div>
      <p
        className={cn(
          "mt-2 break-words text-xl font-semibold tabular leading-tight sm:text-2xl md:text-3xl",
          accentMap[accent],
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 break-words text-xs text-muted-foreground tabular">{hint}</p>
      )}
    </div>
  );
}
