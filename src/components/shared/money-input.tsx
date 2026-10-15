"use client";

import { useState } from "react";
import { parseMoney } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";

export function MoneyInput({
  value,
  onChange,
  id,
  placeholder = "0",
}: {
  value?: number;
  onChange: (value: number) => void;
  id?: string;
  placeholder?: string;
}) {
  const settings = useSettings();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
        {settings.currency === "IDR" ? "Rp" : settings.currency}
      </span>
      <Input
        id={id}
        inputMode="numeric"
        className="pl-10 text-right tabular-nums"
        placeholder={placeholder}
        value={editing ? text : value ? new Intl.NumberFormat(settings.locale).format(value) : ""}
        onFocus={() => {
          setEditing(true);
          setText(value ? String(value) : "");
        }}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d]/g, "");
          setText(next);
          onChange(parseMoney(next));
        }}
        onBlur={() => setEditing(false)}
      />
    </div>
  );
}
