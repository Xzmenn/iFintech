import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/shared/money";

export function StatCard({
  title,
  amount,
  icon: Icon,
  change,
  tone = "primary",
}: {
  title: string;
  amount: number;
  icon: LucideIcon;
  change?: number;
  tone?: "primary" | "emerald" | "rose" | "amber";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    rose: "bg-rose-500/10 text-rose-600",
    amber: "bg-amber-500/10 text-amber-600",
  }[tone];
  const ChangeIcon = (change || 0) >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
              <Money amount={amount} />
            </p>
          </div>
          <span className={`flex size-10 items-center justify-center rounded-xl ${toneClass}`}>
            <Icon className="size-5" />
          </span>
        </div>
        {change !== undefined && (
          <p
            className={`mt-4 flex items-center gap-1 text-xs ${change >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            <ChangeIcon className="size-3.5" /> {Math.abs(change).toFixed(1)}% dibanding bulan lalu
          </p>
        )}
      </CardContent>
    </Card>
  );
}
