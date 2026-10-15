"use client";

import { Button } from "@/components/ui/button";
import { CATEGORY_ICONS, type CategoryIconName } from "@/components/shared/icon-map";
import { cn } from "@/lib/utils";

export { CATEGORY_ICONS, type CategoryIconName } from "@/components/shared/icon-map";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: CategoryIconName) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
        <Button
          key={name}
          type="button"
          aria-label={name}
          variant="outline"
          size="icon"
          className={cn(value === name && "border-primary bg-primary/10 text-primary")}
          onClick={() => onChange(name as CategoryIconName)}
        >
          <Icon className="size-4" />
        </Button>
      ))}
    </div>
  );
}
