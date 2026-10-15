"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { useRecurring } from "@/hooks/use-finance";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  RecurringFormDialog,
  type EditableRecurringRule,
} from "@/components/finance/recurring-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function RecurringList() {
  const query = useRecurring();
  const client = useQueryClient();
  const [editing, setEditing] = useState<EditableRecurringRule | null>(null);

  async function toggle(rule: EditableRecurringRule) {
    try {
      await apiClient(`/api/recurring/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      await client.invalidateQueries({ queryKey: ["recurring"] });
      toast.success(rule.isActive ? "Transaksi berulang dijeda" : "Transaksi berulang dilanjutkan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aturan gagal diperbarui");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus aturan transaksi berulang ini?")) return;
    try {
      await apiClient(`/api/recurring/${id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["recurring"] });
      toast.success("Aturan transaksi berulang dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aturan gagal dihapus");
    }
  }

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (!query.data?.length) {
    return (
      <EmptyState
        title="Belum ada transaksi berulang"
        description="Atur pengulangan ketika menambah transaksi."
      />
    );
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        {query.data.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <strong>{rule.note || rule.type}</strong>
                <p className="text-muted-foreground text-sm">
                  {formatCurrency(rule.amount)} · Berikutnya {formatDate(rule.nextRunDate)} ·{" "}
                  {rule.frequency} setiap {rule.interval} periode
                </p>
                <p className="text-muted-foreground text-xs">
                  {rule.account.name}
                  {rule.endDate && ` · Berakhir ${formatDate(rule.endDate)}`}
                  {!rule.isActive && " · Dijeda"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(rule)}>
                  Ubah
                </Button>
                <Button variant="outline" size="sm" onClick={() => void toggle(rule)}>
                  {rule.isActive ? "Jeda" : "Lanjutkan"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => void remove(rule.id)}>
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <RecurringFormDialog
        rule={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </>
  );
}
