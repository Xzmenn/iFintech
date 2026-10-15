"use client";

import { useEffect } from "react";
import { z } from "zod";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const recurringEditSchema = z.object({
  amount: z.coerce.number().positive("Jumlah harus lebih dari nol").max(1e13),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  interval: z.coerce.number().int().min(1).max(365),
  endDate: z.string().optional(),
  note: z.string().max(1000).optional(),
  isActive: z.boolean(),
});

type RecurringEditValues = z.infer<typeof recurringEditSchema>;

export type EditableRecurringRule = {
  id: string;
  amount: number;
  frequency: RecurringEditValues["frequency"];
  interval: number;
  endDate: string | null;
  note: string | null;
  isActive: boolean;
};

export function RecurringFormDialog({
  rule,
  open,
  onOpenChange,
}: {
  rule: EditableRecurringRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const client = useQueryClient();
  const form = useForm<RecurringEditValues>({
    resolver: zodResolver(recurringEditSchema) as Resolver<RecurringEditValues>,
    defaultValues: {
      amount: 0,
      frequency: "MONTHLY",
      interval: 1,
      endDate: "",
      note: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!rule) return;
    form.reset({
      amount: rule.amount,
      frequency: rule.frequency,
      interval: rule.interval,
      endDate: rule.endDate ? new Date(rule.endDate).toISOString().slice(0, 10) : "",
      note: rule.note || "",
      isActive: rule.isActive,
    });
  }, [form, rule]);

  async function save(values: RecurringEditValues) {
    if (!rule) return;
    try {
      await apiClient(`/api/recurring/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          endDate: values.endDate ? new Date(`${values.endDate}T23:59:59`).toISOString() : null,
        }),
      });
      await client.invalidateQueries({ queryKey: ["recurring"] });
      onOpenChange(false);
      toast.success("Aturan transaksi berulang diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aturan gagal diperbarui");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Transaksi Berulang</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(save)}>
          <div className="space-y-1">
            <Label htmlFor="recurring-amount">Jumlah</Label>
            <Input
              id="recurring-amount"
              type="number"
              min={1}
              step="any"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-destructive text-xs">{form.formState.errors.amount.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Frekuensi</Label>
              <Controller
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Harian</SelectItem>
                      <SelectItem value="WEEKLY">Mingguan</SelectItem>
                      <SelectItem value="MONTHLY">Bulanan</SelectItem>
                      <SelectItem value="YEARLY">Tahunan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="recurring-interval">Interval</Label>
              <Input
                id="recurring-interval"
                type="number"
                min={1}
                max={365}
                {...form.register("interval", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="recurring-end-date">Tanggal akhir (opsional)</Label>
            <Input id="recurring-end-date" type="date" {...form.register("endDate")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="recurring-note">Catatan</Label>
            <Input id="recurring-note" {...form.register("note")} />
          </div>
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Aturan aktif
              </label>
            )}
          />
          <Button type="submit" className="w-full">
            Simpan Perubahan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
