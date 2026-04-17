import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  format?: (v: number) => string;
  hint?: string;
  className?: string;
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  format,
  hint,
  className,
}: Props) {
  const display = format ? format(value) : value.toLocaleString("cs-CZ");
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
            }}
            className="h-8 w-28 text-right tabular text-sm"
            min={min}
            max={max}
            step={step}
          />
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{format ? format(min) : min.toLocaleString("cs-CZ")}</span>
        {hint && <span className="normal-case tracking-normal">{hint}</span>}
        <span>{format ? format(max) : max.toLocaleString("cs-CZ")}</span>
      </div>
      {!hint && (
        <div className="text-xs text-muted-foreground tabular">
          {display}
          {unit ? ` ${unit}` : ""}
        </div>
      )}
    </div>
  );
}
