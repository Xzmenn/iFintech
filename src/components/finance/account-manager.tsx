"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Plus, Archive, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { useAccounts, type Account } from "@/hooks/use-finance";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/shared/money-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColorPicker } from "@/components/shared/color-picker";
import { IconPicker } from "@/components/shared/icon-picker";
import { CategoryIcon } from "@/components/shared/category-icon";

const kinds = [
  ["CASH", "Kas"], ["BANK", "Bank"], ["EWALLET", "E-Wallet"],
  ["CREDIT_CARD", "Kartu Kredit"], ["INVESTMENT", "Investasi"],
];

export function AccountManager() {
  const query = useAccounts();
  const client = useQueryClient();
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("CASH");
  const [initialBalance, setInitialBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [note, setNote] = useState("");
  const [color, setColor] = useState("#0ea5e9");
  const [icon, setIcon] = useState("wallet");
  const accounts = query.data?.items || [];
  const active = accounts.filter((account) => !account.isArchived);
  const archived = accounts.filter((account) => account.isArchived);
  const groups = useMemo(() => kinds.map(([kind, label]) => ({
    label, items: active.filter((account) => account.type === kind),
  })).filter((group) => group.items.length), [active]);
  function start(account?: Account) {
    setEditing(account || null); setName(account?.name || ""); setType(account?.type || "CASH");
    setInitialBalance(account?.initialBalance ?? 0); setCreditLimit(account?.creditLimit ?? 0);
    setNote(account?.note || ""); setColor(account?.color || "#0ea5e9");
    setIcon(account?.icon || "wallet"); setEditor(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiClient(editing ? `/api/accounts/${editing.id}` : "/api/accounts", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({ name, type, initialBalance, creditLimit: type === "CREDIT_CARD" ? creditLimit : null, note, color, icon }),
      });
      await client.invalidateQueries({ queryKey: ["accounts"] });
      setEditor(false); toast.success("Akun berhasil disimpan");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Akun gagal disimpan"); }
  }
  async function archive(account: Account, archived: boolean) {
    try {
      await apiClient(`/api/accounts/${account.id}/archive`, { method: "POST", body: JSON.stringify({ archived }) });
      await client.invalidateQueries({ queryKey: ["accounts"] }); toast.success(archived ? "Akun diarsipkan" : "Arsip akun dibuka");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Akun gagal diperbarui"); }
  }
  async function remove(account: Account) {
    if (!window.confirm(`Hapus akun ${account.name}? Akun dengan transaksi tidak dapat dihapus dan sebaiknya diarsipkan.`)) return;
    try {
      await apiClient(`/api/accounts/${account.id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["accounts"] }); toast.success("Akun dihapus");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Akun gagal dihapus"); }
  }
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  return <>
    <PageHeader title="Akun" description="Kelola rekening, dompet, dan kartu Anda."
      actions={<Button onClick={() => start()}><Plus className="mr-2 size-4" />Tambah Akun</Button>} />
    <Card className="mb-6 bg-primary text-primary-foreground">
      <CardHeader><CardTitle className="text-primary-foreground">Total Kekayaan Bersih</CardTitle></CardHeader>
      <CardContent className="text-3xl font-bold">{formatCurrency(query.data?.netWorth || 0)}</CardContent>
    </Card>
    {groups.length === 0 && <EmptyState title="Belum ada akun aktif" description="Tambahkan akun untuk mulai melacak saldo." />}
    <div className="space-y-7">
      {groups.map((group) => <section key={group.label}>
        <h2 className="mb-3 text-lg font-semibold">{group.label}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{group.items.map((account) =>
          <Card key={account.id} style={{ borderTopColor: account.color, borderTopWidth: 3 }}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><CategoryIcon name={account.icon} color={account.color} className="size-8" />{account.name}</CardTitle>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label="Transfer" asChild><Link href={`/transactions?new=1&type=TRANSFER&accountId=${account.id}`}><ArrowLeftRight className="size-4" /></Link></Button>
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => start(account)}><Pencil className="size-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Arsip" onClick={() => void archive(account, true)}><Archive className="size-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Hapus" onClick={() => void remove(account)}><Trash2 className="size-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {account.type === "CREDIT_CARD" ? <>
                <p className="text-xs text-muted-foreground">Tagihan</p>
                <p className="text-2xl font-bold">{formatCurrency(Math.max(0, -account.balance))}</p>
                <p className="mt-1 text-xs text-muted-foreground">Limit {formatCurrency(account.creditLimit || 0)} · Terpakai {Math.round(Math.max(0, -account.balance) / (account.creditLimit || 1) * 100)}%</p>
              </> : <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>}
              {account.note && <p className="mt-2 text-sm text-muted-foreground">{account.note}</p>}
            </CardContent>
          </Card>)}</div>
      </section>)}
    </div>
    {archived.length > 0 && <details className="mt-8 rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Diarsipkan ({archived.length})</summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{archived.map((account) => <Card key={account.id}><CardContent className="flex items-center justify-between p-4">
        <span>{account.name} · {formatCurrency(account.balance)}</span><Button variant="outline" size="sm" onClick={() => void archive(account, false)}>Pulihkan</Button>
      </CardContent></Card>)}</div>
    </details>}
    <Dialog open={editor} onOpenChange={setEditor}><DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Ubah Akun" : "Tambah Akun"}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={(event) => void save(event)}>
        <Input required placeholder="Nama akun" value={name} onChange={(event) => setName(event.target.value)} />
        <select className="h-10 w-full rounded-md border bg-background px-3" value={type} onChange={(event) => setType(event.target.value)}>{kinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <label className="block text-sm">Saldo awal<MoneyInput value={initialBalance} onChange={setInitialBalance} /></label>
        {type === "CREDIT_CARD" && <label className="block text-sm">Batas kredit<MoneyInput value={creditLimit} onChange={setCreditLimit} /></label>}
        <ColorPicker value={color} onChange={setColor} />
        <IconPicker value={icon} onChange={setIcon} />
        <Input placeholder="Catatan" value={note} onChange={(event) => setNote(event.target.value)} />
        <Button type="submit" className="w-full">Simpan</Button>
      </form>
    </DialogContent></Dialog>
  </>;
}
