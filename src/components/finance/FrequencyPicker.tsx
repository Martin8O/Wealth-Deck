import { FREQUENCY_OPTIONS, Frequency } from "@/lib/finance/frequency";
import { SegmentedControl } from "./SegmentedControl";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  value: Frequency;
  onChange: (v: Frequency) => void;
}

export function FrequencyPicker({ value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <SegmentedControl<Frequency>
      value={value}
      onChange={onChange}
      options={FREQUENCY_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`freq.${o.value}`),
      }))}
      size="sm"
    />
  );
}
