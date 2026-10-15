import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message = "Terjadi kesalahan saat memuat data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border-destructive/20 bg-destructive/5 flex min-h-56 flex-col items-center justify-center rounded-2xl border p-8 text-center">
      <AlertCircle className="text-destructive mb-3 size-8" />
      <p className="text-muted-foreground max-w-md text-sm">{message}</p>
      {onRetry && (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
