import { FREQUENCY_OPTIONS, Frequency } from "@/lib/finance/frequency";
import { SegmentedControl } from "./SegmentedControl";

interface Props {
  value: Frequency;
  onChange: (v: Frequency) => void;
}

export function FrequencyPicker({ value, onChange }: Props) {
  return (
    <SegmentedControl<Frequency>
      value={value}
      onChange={onChange}
      options={FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      size="sm"
    />
  );
}
