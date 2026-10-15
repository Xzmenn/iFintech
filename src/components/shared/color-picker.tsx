"use client";

import { Input } from "@/components/ui/input";

export function ColorPicker({
  value,
  onChange,
  label = "Warna",
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  return (
    <label className="flex w-fit items-center gap-3 text-sm">
      <span>{label}</span>
      <Input aria-label={label} type="color" className="h-9 w-12 cursor-pointer p-1" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
