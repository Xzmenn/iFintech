"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAccounts, useCategories, useRecurring, useTransactions, type FinanceTransaction } from "@/hooks/use-finance";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounts as getAccounts, useCategories as getCategories } from "@/hooks/use-finance";
import { Switch } from "@/components/ui/switch";
import { MoneyInput } from "@/components/shared/money-input";
import { transactionSchema } from "@/lib/validations/transaction";

const column = createColumnHelper<FinanceTransaction>();

export function TransactionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const params = new URLSearchParams(searchParams.toString());
  const [search, setSearch] = useState(params.get("q") || "");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);
  const [preset, setPreset] = useState<{ type?: "INCOME" | "EXPENSE" | "TRANSFER"; accountId?: string }>({});
  const transactions = useTransactions(params);
  const recurring = useRecurring();
  const accounts = useAccounts();
  const categories = useCategories();
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      next.set("page", "1");
      router.replace(`${pathname}?${next.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pathname, router, searchParams]);
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      const requestedType = searchParams.get("type");
      setPreset({
        type: requestedType === "INCOME" || requestedType === "TRANSFER" ? requestedType : "EXPENSE",
        accountId: searchParams.get("accountId") || undefined,
      });
      setEditing(null); setDialog(true);
      const next = new URLSearchParams(searchParams.toString()); next.delete("new");
      router.replace(`${pathname}?${next.toString()}`);
    }
  }, [searchParams, pathname, router]);
  const remove = useCallback(async (id: string) => {
    if (!window.confirm("Hapus transaksi ini? Saldo akun akan dihitung ulang.")) return;
    try {
      await apiClient(`/api/transactions/${id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["transactions"] });
      await client.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Transaksi dihapus");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Transaksi gagal dihapus"); }
  }, [client]);
  const columns = useMemo(() => [
    column.accessor("date", { header: "Tanggal", cell: (info) => formatDate(info.getValue()) }),
    column.display({ id: "description", header: "Keterangan", cell: ({ row }) => <div>
      <div className="font-medium">{row.original.category?.name || row.original.note || "Transaksi"}</div>
      <div className="text-xs text-muted-foreground">{row.original.subCategory?.name || row.original.note || ""} {row.original.tags.map(({ tag }) => `#${tag.name}`).join(" ")}</div>
    </div> }),
    column.display({ id: "account", header: "Akun", cell: ({ row }) => row.original.type === "TRANSFER"
      ? `${row.original.account.name} → ${row.original.toAccount?.name || "—"}` : row.original.account.name }),
    column.accessor("amount", { header: "Jumlah", cell: ({ row }) => <span className={row.original.type === "INCOME" ? "text-emerald-600" : row.original.type === "EXPENSE" ? "text-red-600" : ""}>
      {row.original.type === "INCOME" ? "+" : row.original.type === "EXPENSE" ? "−" : ""}{formatCurrency(row.original.amount)}
    </span> }),
    column.display({ id: "attachments", header: "", cell: ({ row }) => row.original.attachments.length
      ? <a href={`/api/attachments/${row.original.attachments[0].id}`} aria-label="Unduh lampiran"><Paperclip className="size-4" /></a> : null }),
    column.display({ id: "actions", header: "Aksi", cell: ({ row }) => <div className="flex gap-1">
      <Button variant="ghost" size="icon" aria-label="Ubah" onClick={() => { setEditing(row.original); setDialog(true); }}><Pencil className="size-4" /></Button>
      <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => void remove(row.original.id)}><Trash2 className="size-4" /></Button>
    </div> }),
  ], [remove]);
  async function toggleRecurring(rule: { id: string; isActive: boolean }) {
    try {
      await apiClient(`/api/recurring/${rule.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !rule.isActive }) });
      await client.invalidateQueries({ queryKey: ["recurring"] });
      toast.success(rule.isActive ? "Transaksi berulang dijeda" : "Transaksi berulang dilanjutkan");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Aturan gagal diperbarui"); }
  }
  async function editRecurring(rule: { id: string; amount: number; interval: number }) {
    const amount = window.prompt("Jumlah transaksi berulang", String(rule.amount));
    if (amount === null) return;
    const interval = window.prompt("Ulangi setiap berapa periode?", String(rule.interval));
    if (interval === null) return;
    try {
      await apiClient(`/api/recurring/${rule.id}`, {
        method: "PATCH", body: JSON.stringify({ amount: Number(amount), interval: Number(interval) }),
      });
      await client.invalidateQueries({ queryKey: ["recurring"] }); toast.success("Aturan berulang diperbarui");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Aturan gagal diperbarui"); }
  }
  async function deleteRecurringRule(id: string) {
    if (!window.confirm("Hapus aturan berulang ini?")) return;
    try {
      await apiClient(`/api/recurring/${id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["recurring"] }); toast.success("Aturan berulang dihapus");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Aturan gagal dihapus"); }
  }
  return <>
    <PageHeader title="Transaksi" description="Catat dan tinjau seluruh pemasukan serta pengeluaran."
      actions={<Button onClick={() => { setEditing(null); setPreset({}); setDialog(true); }}><Plus className="mr-2 size-4" />Tambah Transaksi</Button>} />
    <Tabs defaultValue="transactions">
      <TabsList><TabsTrigger value="transactions">Transaksi</TabsTrigger><TabsTrigger value="recurring">Transaksi Berulang</TabsTrigger></TabsList>
      <TabsContent value="transactions">
        <div className="my-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          <Input placeholder="Cari catatan, kategori, akun, tag…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="h-10 rounded-md border bg-background px-3" value={params.get("type") || ""} onChange={(event) => setParam("type", event.target.value)}>
            <option value="">Semua jenis</option><option value="EXPENSE">Pengeluaran</option><option value="INCOME">Pemasukan</option><option value="TRANSFER">Transfer</option>
          </select>
          <select className="h-10 rounded-md border bg-background px-3" value={params.get("accountId") || ""} onChange={(event) => setParam("accountId", event.target.value)}>
            <option value="">Semua akun</option>{(accounts.data?.items || []).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3" value={params.get("categoryId") || ""} onChange={(event) => setParam("categoryId", event.target.value)}>
            <option value="">Semua kategori</option>{(categories.data || []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <Input aria-label="Dari tanggal" type="date" value={params.get("from")?.slice(0, 10) || ""} onChange={(event) => setParam("from", event.target.value ? new Date(`${event.target.value}T00:00:00`).toISOString() : "")} />
          <Input aria-label="Sampai tanggal" type="date" value={params.get("to")?.slice(0, 10) || ""} onChange={(event) => setParam("to", event.target.value ? new Date(`${event.target.value}T23:59:59`).toISOString() : "")} />
          <div className="flex gap-2"><Input placeholder="Min jumlah" type="number" value={params.get("minAmount") || ""} onChange={(event) => setParam("minAmount", event.target.value)} /><Input placeholder="Maks jumlah" type="number" value={params.get("maxAmount") || ""} onChange={(event) => setParam("maxAmount", event.target.value)} /></div>
          <Button variant="outline" onClick={() => { setSearch(""); router.replace(pathname); }}>Reset filter</Button>
        </div>
        {transactions.isLoading ? <LoadingState /> : transactions.isError ? <ErrorState onRetry={() => void transactions.refetch()} /> : !transactions.data?.items.length
          ? <EmptyState title="Belum ada transaksi" description="Tambahkan transaksi untuk mulai melacak keuangan." />
          : <>
            <div className="hidden md:block"><DataTable columns={columns as unknown as ColumnDef<FinanceTransaction, unknown>[]} data={transactions.data.items} page={(transactions.data.page || 1) - 1}
              pageSize={transactions.data.pageSize} total={transactions.data.total}
              onPageChange={(page) => setParam("page", String(page + 1))}
              onSortingChange={(sort) => { const next = new URLSearchParams(searchParams.toString()); next.set("sort", sort[0]?.id === "amount" ? "amount" : "date"); next.set("order", sort[0]?.desc ? "desc" : "asc"); router.replace(`${pathname}?${next}`); }} /></div>
            <div className="space-y-3 md:hidden">{transactions.data.items.map((tx) => <Card key={tx.id}><CardContent className="p-4">
              <div className="flex justify-between gap-2"><div><p className="font-medium">{tx.category?.name || tx.note || "Transaksi"}</p><p className="text-xs text-muted-foreground">{formatDate(tx.date)} · {tx.account.name}</p></div>
                <strong className={tx.type === "INCOME" ? "text-emerald-600" : tx.type === "EXPENSE" ? "text-red-600" : ""}>{formatCurrency(tx.amount)}</strong></div>
              {tx.type === "TRANSFER" && <p className="mt-1 text-xs">{tx.account.name} → {tx.toAccount?.name}</p>}
              <div className="mt-2 flex gap-2"><Button variant="outline" size="sm" onClick={() => { setEditing(tx); setDialog(true); }}>Ubah</Button><Button variant="outline" size="sm" onClick={() => void remove(tx.id)}>Hapus</Button>
                {tx.attachments.map((attachment) => <a className="text-sm underline" href={`/api/attachments/${attachment.id}`} key={attachment.id}>Lampiran</a>)}</div>
            </CardContent></Card>)}</div>
            <div className="mt-4 flex justify-between md:hidden"><Button variant="outline" disabled={Number(params.get("page") || 1) <= 1} onClick={() => setParam("page", String(Math.max(1, Number(params.get("page") || 1) - 1)))}>Sebelumnya</Button>
              <span className="self-center text-sm">Halaman {params.get("page") || "1"}</span><Button variant="outline" disabled={transactions.data.items.length < transactions.data.pageSize} onClick={() => setParam("page", String(Number(params.get("page") || 1) + 1))}>Berikutnya</Button></div>
          </>}
      </TabsContent>
      <TabsContent value="recurring">
        {recurring.isLoading ? <LoadingState /> : recurring.isError ? <ErrorState onRetry={() => void recurring.refetch()} /> : !recurring.data?.length
          ? <EmptyState title="Belum ada transaksi berulang" description="Atur pengulangan ketika menambah transaksi." />
          : <div className="mt-4 space-y-2">{recurring.data.map((rule) => <Card key={rule.id}><CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div><strong>{rule.note || rule.type}</strong><p className="text-sm text-muted-foreground">{formatCurrency(rule.amount)} · Berikutnya {formatDate(rule.nextRunDate)} · {rule.frequency}</p></div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void editRecurring(rule)}>Ubah</Button>
              <Button variant="outline" size="sm" onClick={() => void toggleRecurring(rule)}>{rule.isActive ? "Jeda" : "Lanjutkan"}</Button>
              <Button variant="outline" size="sm" onClick={() => void deleteRecurringRule(rule.id)}>Hapus</Button></div>
          </CardContent></Card>)}</div>}
      </TabsContent>
    </Tabs>
    <TransactionDialog open={dialog} onOpenChange={setDialog} transaction={editing} preset={preset}
      onSaved={async () => { await client.invalidateQueries({ queryKey: ["transactions"] }); await client.invalidateQueries({ queryKey: ["accounts"] }); await client.invalidateQueries({ queryKey: ["recurring"] }); }} />
  </>;
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    router.replace(`${pathname}?${next.toString()}`);
  }
}

function TransactionDialog({ open, onOpenChange, transaction, preset, onSaved }: {
  open: boolean; onOpenChange: (open: boolean) => void; transaction: FinanceTransaction | null;
  preset: { type?: "INCOME" | "EXPENSE" | "TRANSFER"; accountId?: string }; onSaved: () => Promise<void>;
}) {
  const accountsQuery = getAccounts();
  const categoriesQuery = getCategories();
  const accounts = useMemo(() => (accountsQuery.data?.items || []).filter((account) => !account.isArchived), [accountsQuery.data]);
  type FormValues = {
    type: "EXPENSE" | "INCOME" | "TRANSFER"; amount: number; date: Date;
    accountId: string; toAccountId?: string | null; categoryId?: string | null;
    subCategoryId?: string | null; note?: string | null; tags?: string[];
  };
  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema) as Resolver<FormValues>,
    defaultValues: {
      type: "EXPENSE", amount: 0, date: new Date(), accountId: "",
      toAccountId: "", categoryId: "", subCategoryId: "", note: "", tags: [],
    },
  });
  const type = form.watch("type");
  const accountId = form.watch("accountId");
  const categoryId = form.watch("categoryId");
  const [tags, setTags] = useState(transaction?.tags.map(({ tag }) => tag.name).join(", ") || "");
  const [repeat, setRepeat] = useState(false);
  const [frequency, setFrequency] = useState("MONTHLY");
  const [interval, setInterval] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const resetForm = form.reset;
  useEffect(() => {
    setTags(transaction?.tags.map(({ tag }) => tag.name).join(", ") || "");
    resetForm({
      type: transaction?.type || preset.type || "EXPENSE",
      amount: transaction?.amount || 0,
      date: transaction ? new Date(transaction.date) : new Date(),
      accountId: transaction?.account.id || preset.accountId || accounts[0]?.id || "",
      toAccountId: transaction?.toAccount?.id || "",
      categoryId: transaction?.category?.id || "",
      subCategoryId: transaction?.subCategory
        ? categoriesQuery.data?.find((category) => category.id === transaction.category?.id)
          ?.subCategories.find((sub) => sub.name === transaction.subCategory?.name)?.id || ""
        : "",
      note: transaction?.note || "",
      tags: transaction?.tags.map(({ tag }) => tag.name) || [],
    });
    setFile(null); setRepeat(false); setEndDate("");
  }, [transaction, open, accounts, categoriesQuery.data, preset, resetForm]);
  useEffect(() => {
    void apiClient<{ name: string }[]>("/api/tags").then((items) => setTagSuggestions(items.map((tag) => tag.name))).catch(() => undefined);
  }, []);
  async function save(values: FormValues) {
    const body = {
      type: values.type,
      amount: values.amount,
      date: values.date.toISOString(),
      accountId: values.accountId,
      ...(values.type === "TRANSFER"
        ? { toAccountId: values.toAccountId }
        : { categoryId: values.categoryId, ...(values.subCategoryId ? { subCategoryId: values.subCategoryId } : {}) }),
      note: values.note,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      const result = await apiClient<{ transaction: { id: string }; warnings: { categoryName: string; percent: number; status: string }[] }>(
        transaction ? `/api/transactions/${transaction.id}` : "/api/transactions",
        { method: transaction ? "PATCH" : "POST", body: JSON.stringify(body) },
      );
      if (file) {
        const form = new FormData(); form.set("file", file);
        await apiClient(`/api/transactions/${result.transaction.id}/attachments`, { method: "POST", body: form });
      }
      if (repeat && !transaction) {
        await apiClient("/api/recurring", { method: "POST", body: JSON.stringify({
          ...body, startDate: body.date, frequency, interval, tagNames: body.tags.join(","),
          ...(endDate ? { endDate: new Date(`${endDate}T23:59:59`).toISOString() } : {}),
        }) });
      }
      await onSaved(); onOpenChange(false); toast.success("Transaksi berhasil disimpan");
      result.warnings.forEach((warning) => toast.warning(`${warning.categoryName}: ${warning.percent}% anggaran (${warning.status})`));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Transaksi gagal disimpan"); }
  }
  const categories = (categoriesQuery.data || []).filter((category) => category.type === type);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
    <DialogHeader><DialogTitle>{transaction ? "Ubah Transaksi" : "Tambah Transaksi"}</DialogTitle></DialogHeader>
    <form className="space-y-3" onSubmit={form.handleSubmit(save)}>
      <div className="grid grid-cols-3 gap-1">{[["EXPENSE", "Pengeluaran"], ["INCOME", "Pemasukan"], ["TRANSFER", "Transfer"]].map(([value, label]) =>
        <Button key={value} type="button" variant={type === value ? "default" : "outline"} onClick={() => {
          form.setValue("type", value as FormValues["type"], { shouldValidate: true });
          if (value !== type) {
            form.setValue("categoryId", "");
            form.setValue("subCategoryId", "");
          }
        }}>{label}</Button>)}</div>
      <Controller control={form.control} name="amount" render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />} />
      {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
      <Controller control={form.control} name="date" render={({ field }) => <Input type="date" required value={field.value.toISOString().slice(0, 10)} onChange={(event) => field.onChange(new Date(`${event.target.value}T12:00:00`))} />} />
      <select className="h-10 w-full rounded-md border bg-background px-3" required {...form.register("accountId")}>
        <option value="">Pilih akun</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {formatCurrency(account.balance)}</option>)}
      </select>
      {type === "TRANSFER" ? <select className="h-10 w-full rounded-md border bg-background px-3" required {...form.register("toAccountId")}>
        <option value="">Akun tujuan</option>{accounts.filter((account) => account.id !== accountId).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
      </select> : <select className="h-10 w-full rounded-md border bg-background px-3" required value={categoryId || ""} onChange={(event) => {
        form.setValue("categoryId", event.target.value, { shouldValidate: true });
        form.setValue("subCategoryId", "");
      }}>
        <option value="">Pilih kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>}
      <Input placeholder="Catatan" {...form.register("note")} />
      <Input list="tag-suggestions" placeholder="Tag dipisahkan koma" value={tags} onChange={(event) => setTags(event.target.value)} />
      <datalist id="tag-suggestions">{tagSuggestions.map((tag) => <option key={tag} value={tag} />)}</datalist>
      {!transaction && <><label className="flex items-center gap-2 text-sm"><Switch checked={repeat} onCheckedChange={setRepeat} />Ulangi transaksi ini</label>
        {repeat && <div className="grid grid-cols-2 gap-2"><select className="h-10 rounded-md border bg-background px-3" value={frequency} onChange={(event) => setFrequency(event.target.value)}>
          <option value="DAILY">Harian</option><option value="WEEKLY">Mingguan</option><option value="MONTHLY">Bulanan</option><option value="YEARLY">Tahunan</option></select>
          <Input type="number" min="1" value={interval} onChange={(event) => setInterval(Number(event.target.value))} />
          <Input className="col-span-2" type="date" aria-label="Tanggal akhir pengulangan" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>}
      </>}
      {type !== "TRANSFER" && categoryId && (categoriesQuery.data?.find((category) => category.id === categoryId)?.subCategories.length || 0) > 0 &&
        <select className="h-10 w-full rounded-md border bg-background px-3" {...form.register("subCategoryId")}>
          <option value="">Tanpa subkategori</option>{categoriesQuery.data?.find((category) => category.id === categoryId)?.subCategories.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
        </select>}
      <Input type="file" accept="image/*,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      {transaction?.attachments.map((attachment) => <div className="flex items-center gap-3 text-sm" key={attachment.id}>
        <a className="underline" href={`/api/attachments/${attachment.id}`}>{attachment.fileName}</a>
        <button type="button" className="text-destructive" onClick={async () => {
          try { await apiClient(`/api/attachments/${attachment.id}`, { method: "DELETE" }); toast.success("Lampiran dihapus"); }
          catch (error) { toast.error(error instanceof Error ? error.message : "Lampiran gagal dihapus"); }
        }}>Hapus</button>
      </div>)}
      <Button type="submit" className="w-full">Simpan Transaksi</Button>
    </form>
  </DialogContent></Dialog>;
}
