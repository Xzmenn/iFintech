import { getCategoryIcon } from "@/components/shared/icon-map";

export function CategoryIcon({
  name,
  color = "#64748b",
  className,
}: {
  name: string;
  color?: string;
  className?: string;
}) {
  const Icon = getCategoryIcon(name);
  return (
    <span className={`inline-flex size-9 items-center justify-center rounded-xl ${className || ""}`} style={{ color, backgroundColor: `${color}18` }}>
      <Icon className="size-4" />
    </span>
  );
}
