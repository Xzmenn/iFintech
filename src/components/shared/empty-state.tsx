import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Belum ada data",
  description = "Data yang Anda tambahkan akan muncul di sini.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-card/70 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
      <span className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-2xl">
        <Inbox className="size-5" />
      </span>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
