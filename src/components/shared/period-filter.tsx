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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PeriodFilter({
  value,
  onChange,
  from,
  to,
  onRangeChange,
}: {
  value: PeriodPreset;
  onChange: (value: PeriodPreset) => void;
  from?: string;
  to?: string;
  onRangeChange?: (range: { from: string; to: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="sr-only">Periode</Label>
        <Select value={value} onValueChange={(next) => onChange(next as PeriodPreset)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_PRESETS.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value === "custom" && onRangeChange && (
        <>
          <div className="space-y-1">
            <Label htmlFor="period-from">Dari</Label>
            <Input
              id="period-from"
              type="date"
              value={from || ""}
              onChange={(event) => onRangeChange({ from: event.target.value, to: to || "" })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="period-to">Sampai</Label>
            <Input
              id="period-to"
              type="date"
              value={to || ""}
              onChange={(event) => onRangeChange({ from: from || "", to: event.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );
}
