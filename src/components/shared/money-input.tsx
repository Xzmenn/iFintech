"use client";

import { useState } from "react";
import { parseMoney } from "@/lib/money";
import { Input } from "@/components/ui/input";

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
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
      <Input
        id={id}
        inputMode="numeric"
        className="pl-10 text-right tabular-nums"
        placeholder={placeholder}
        value={editing ? text : value ? new Intl.NumberFormat("id-ID").format(value) : ""}
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
