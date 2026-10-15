"use client";

import type { PeriodPreset } from "@/lib/dates";
import { PERIOD_PRESETS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PeriodFilter({
  value,
  onChange,
}: {
  value: PeriodPreset;
  onChange: (value: PeriodPreset) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as PeriodPreset)}>
      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
      <SelectContent>
        {PERIOD_PRESETS.map((period) => (
          <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
