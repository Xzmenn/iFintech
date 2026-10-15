"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TagInput({
  value,
  suggestions,
  onChange,
}: {
  value: string[];
  suggestions: string[];
  onChange: (value: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const matches = useMemo(
    () =>
      suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(input.trim().toLowerCase()) &&
          !value.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()),
      ),
    [input, suggestions, value],
  );

  function add(raw = input) {
    const names = raw
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter(Boolean);
    if (!names.length) return;
    const next = [...value];
    for (const name of names) {
      if (!next.some((tag) => tag.toLowerCase() === name.toLowerCase())) next.push(name);
    }
    onChange(next);
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-4 rounded-full p-0"
              aria-label={`Hapus tag ${tag}`}
              onClick={() => onChange(value.filter((item) => item !== tag))}
            >
              <X className="size-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        placeholder="Tambah tag (Enter atau koma)"
        aria-label="Tambah tag"
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add();
          }
        }}
      />
      {input.trim() && matches.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Saran tag">
          {matches.slice(0, 8).map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => add(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
