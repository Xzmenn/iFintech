"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { transactionSchema } from "@/lib/validations/transaction";
import { useAccounts, useCategories, type FinanceTransaction } from "@/hooks/use-finance";
import { MoneyInput } from "@/components/shared/money-input";
import { TagInput } from "@/components/finance/tag-input";
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

type FormValues = {
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  date: Date;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  note?: string | null;
  tags?: string[];
};

type Preset = { type?: FormValues["type"]; accountId?: string };

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  preset,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinanceTransaction | null;
  preset: Preset;
  onSaved: () => Promise<void>;
}) {
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const accounts = useMemo(
    () => (accountsQuery.data?.items || []).filter((account) => !account.isArchived),
    [accountsQuery.data],
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema) as Resolver<FormValues>,
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      date: new Date(),
      accountId: "",
      toAccountId: "",
      categoryId: "",
      subCategoryId: "",
      note: "",
      tags: [],
    },
  });
  const type = form.watch("type");
  const accountId = form.watch("accountId");
  const categoryId = form.watch("categoryId");
  const tags = form.watch("tags") || [];
  const selectedCategory = categoriesQuery.data?.find((category) => category.id === categoryId);
  const availableCategories = (categoriesQuery.data || []).filter(
    (category) => category.type === type,
  );
  const [repeat, setRepeat] = useState(false);
  const [frequency, setFrequency] = useState("MONTHLY");
  const [interval, setInterval] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<FinanceTransaction["attachments"]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const category = categoriesQuery.data?.find((item) => item.id === transaction?.category?.id);
    const subCategory = category?.subCategories.find(
      (sub) => sub.name === transaction?.subCategory?.name,
    );
    form.reset({
      type: transaction?.type || preset.type || "EXPENSE",
      amount: transaction?.amount || 0,
      date: transaction ? new Date(transaction.date) : new Date(),
      accountId: transaction?.account.id || preset.accountId || accounts[0]?.id || "",
      toAccountId: transaction?.toAccount?.id || "",
      categoryId: transaction?.category?.id || "",
      subCategoryId: subCategory?.id || "",
      note: transaction?.note || "",
      tags: transaction?.tags.map(({ tag }) => tag.name) || [],
    });
    setAttachments(transaction?.attachments || []);
    setFile(null);
    setRepeat(false);
    setEndDate("");
  }, [accounts, categoriesQuery.data, form, open, preset, transaction]);

  useEffect(() => {
    void apiClient<{ name: string }[]>("/api/tags")
      .then((items) => setTagSuggestions(items.map((tag) => tag.name)))
      .catch(() => undefined);
  }, []);

  async function save(values: FormValues) {
    const body = {
      type: values.type,
      amount: values.amount,
      date: values.date.toISOString(),
      accountId: values.accountId,
      ...(values.type === "TRANSFER"
        ? { toAccountId: values.toAccountId }
        : {
            categoryId: values.categoryId,
            ...(values.subCategoryId ? { subCategoryId: values.subCategoryId } : {}),
          }),
      note: values.note,
      tags,
    };

    try {
      const result = await apiClient<{
        transaction: { id: string };
        warnings: { categoryName: string; percent: number; status: string }[];
      }>(transaction ? `/api/transactions/${transaction.id}` : "/api/transactions", {
        method: transaction ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      if (file) {
        const upload = new FormData();
        upload.set("file", file);
        await apiClient(`/api/transactions/${result.transaction.id}/attachments`, {
          method: "POST",
          body: upload,
        });
      }
      if (repeat && !transaction) {
        await apiClient("/api/recurring", {
          method: "POST",
          body: JSON.stringify({
            ...body,
            startDate: body.date,
            frequency,
            interval,
            tagNames: tags.join(","),
            ...(endDate ? { endDate: new Date(`${endDate}T23:59:59`).toISOString() } : {}),
          }),
        });
      }
      await onSaved();
      onOpenChange(false);
      toast.success("Transaksi berhasil disimpan");
      result.warnings.forEach((warning) =>
        toast.warning(`${warning.categoryName}: ${warning.percent}% anggaran (${warning.status})`),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaksi gagal disimpan";
      if (error instanceof ApiError && error.status === 422) {
        form.setError("amount", { message });
      }
      toast.error(message);
    }
  }

  async function deleteAttachment(id: string) {
    try {
      await apiClient(`/api/attachments/${id}`, { method: "DELETE" });
      setAttachments((current) => current.filter((attachment) => attachment.id !== id));
      toast.success("Lampiran dihapus");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lampiran gagal dihapus");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction ? "Ubah Transaksi" : "Tambah Transaksi"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(save)}>
          <div className="grid grid-cols-3 gap-1">
            {[
              ["EXPENSE", "Pengeluaran"],
              ["INCOME", "Pemasukan"],
              ["TRANSFER", "Transfer"],
            ].map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={type === value ? "default" : "outline"}
                onClick={() => {
                  form.setValue("type", value as FormValues["type"], { shouldValidate: true });
                  if (value !== type) {
                    form.setValue("categoryId", "");
                    form.setValue("subCategoryId", "");
                  }
                }}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            <Label htmlFor="transaction-amount">Jumlah</Label>
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <MoneyInput value={field.value} onChange={field.onChange} id="transaction-amount" />
              )}
            />
            {form.formState.errors.amount && (
              <p className="text-destructive text-xs">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="transaction-date">Tanggal</Label>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <Input
                  id="transaction-date"
                  type="date"
                  required
                  value={field.value.toISOString().slice(0, 10)}
                  onChange={(event) => field.onChange(new Date(`${event.target.value}T12:00:00`))}
                />
              )}
            />
          </div>

          <div className="space-y-1">
            <Label>Akun</Label>
            <Controller
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih akun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih akun</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} · {formatCurrency(account.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {type === "TRANSFER" ? (
            <div className="space-y-1">
              <Label>Akun tujuan</Label>
              <Controller
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih akun tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Pilih akun tujuan</SelectItem>
                      {accounts
                        .filter((account) => account.id !== accountId)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Kategori</Label>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? "" : value);
                        form.setValue("subCategoryId", "");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Pilih kategori</SelectItem>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {!!selectedCategory?.subCategories.length && (
                <div className="space-y-1">
                  <Label>Subkategori</Label>
                  <Controller
                    control={form.control}
                    name="subCategoryId"
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tanpa subkategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa subkategori</SelectItem>
                          {selectedCategory.subCategories.map((subCategory) => (
                            <SelectItem key={subCategory.id} value={subCategory.id}>
                              {subCategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="transaction-note">Catatan</Label>
            <Input id="transaction-note" placeholder="Catatan" {...form.register("note")} />
          </div>
          <div className="space-y-1">
            <Label>Tag</Label>
            <TagInput
              value={tags}
              suggestions={tagSuggestions}
              onChange={(next) => form.setValue("tags", next, { shouldDirty: true })}
            />
          </div>

          {!transaction && (
            <div className="space-y-3 rounded-lg border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Switch checked={repeat} onCheckedChange={setRepeat} />
                Ulangi transaksi ini
              </label>
              {repeat && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Frekuensi</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
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
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="repeat-interval">Setiap berapa periode</Label>
                    <Input
                      id="repeat-interval"
                      type="number"
                      min={1}
                      value={interval}
                      onChange={(event) => setInterval(Number(event.target.value))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="repeat-end-date">Tanggal akhir (opsional)</Label>
                    <Input
                      id="repeat-end-date"
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="transaction-attachment">Lampiran</Label>
            <Input
              id="transaction-attachment"
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            {attachments.map((attachment) => (
              <div className="flex items-center justify-between gap-3 text-sm" key={attachment.id}>
                <a className="truncate underline" href={`/api/attachments/${attachment.id}`}>
                  {attachment.fileName}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void deleteAttachment(attachment.id)}
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>
          <Button type="submit" className="w-full">
            Simpan Transaksi
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
