"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronLeft, ChevronRight, Pencil, Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useCurrencyFormatter } from "@/hooks/use-settings";
import { useBudgets, useCategories, type Budget } from "@/hooks/use-finance";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { MoneyInput } from "@/components/shared/money-input";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type BudgetHistoryPoint = {
  year: number;
  month: number;
  label: string;
  budget: number;
  spent: number;
};

const statusColor = {
  aman: "bg-emerald-500",
  peringatan: "bg-amber-500",
  melebihi: "bg-red-500",
};
const statusLabel = { aman: "Aman", peringatan: "Peringatan", melebihi: "Melebihi anggaran" };

export function BudgetManager() {
  const formatCurrency = useCurrencyFormatter();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year = period.getFullYear();
  const month = period.getMonth() + 1;
  const query = useBudgets(year, month);
  const categoriesQuery = useCategories("EXPENSE");
  const client = useQueryClient();
  const [editing, setEditing] = useState<Budget | null>(null);
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(0);
  const [threshold, setThreshold] = useState(80);
  const [note, setNote] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const history = useQuery({
    queryKey: ["budget-history", selectedCategoryId, year, month],
    enabled: Boolean(selectedCategoryId),
    queryFn: () =>
      apiClient<BudgetHistoryPoint[]>(
        `/api/budgets/history?categoryId=${selectedCategoryId}&year=${year}&month=${month}&months=6`,
      ),
  });
  const categories = categoriesQuery.data || [];
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const alerts = items.filter((budget) => budget.status !== "aman");
  const selectedCategory =
    items.find((budget) => budget.categoryId === selectedCategoryId)?.category ||
    categories.find((category) => category.id === selectedCategoryId);

  useEffect(() => {
    if (!selectedCategoryId && items.length) setSelectedCategoryId(items[0].categoryId);
  }, [items, selectedCategoryId]);

  function start(budget?: Budget) {
    setEditing(budget || null);
    setCategoryId(budget?.categoryId || categories[0]?.id || "");
    setAmount(budget?.amount || 0);
    setThreshold(budget?.alertThreshold || 80);
    setNote(budget?.note || "");
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiClient(editing ? `/api/budgets/${editing.id}` : "/api/budgets", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          categoryId,
          year,
          month,
          amount,
          alertThreshold: threshold,
          note,
        }),
      });
      await client.invalidateQueries({ queryKey: ["budgets"] });
      setOpen(false);
      toast.success("Anggaran berhasil disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Anggaran gagal disimpan");
    }
  }

  async function remove(budget: Budget) {
    if (!window.confirm(`Hapus anggaran ${budget.category.name} bulan ini?`)) return;
    try {
      await apiClient(`/api/budgets/${budget.id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Anggaran dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Anggaran gagal dihapus");
    }
  }

  async function copyPrevious() {
    try {
      const previous = new Date(year, month - 2, 1);
      const result = await apiClient<{ copied: number; skipped: number }>("/api/budgets/copy", {
        method: "POST",
        body: JSON.stringify({
          fromYear: previous.getFullYear(),
          fromMonth: previous.getMonth() + 1,
          toYear: year,
          toMonth: month,
        }),
      });
      await client.invalidateQueries({ queryKey: ["budgets"] });
      toast.success(
        result.copied
          ? `${result.copied} anggaran disalin${result.skipped ? `, ${result.skipped} dilewati` : ""}`
          : "Tidak ada anggaran baru untuk disalin",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Anggaran gagal disalin");
    }
  }

  const moveMonth = (offset: number) =>
    setPeriod((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return (
    <>
      <PageHeader
        title="Anggaran"
        description="Rencanakan pengeluaran bulanan dan pantau pemakaiannya."
        actions={
          <>
            <Button variant="outline" onClick={() => void copyPrevious()}>
              <Copy className="mr-2 size-4" />
              Salin dari bulan lalu
            </Button>
            <Button onClick={() => start()}>
              <Plus className="mr-2 size-4" />
              Tambah Anggaran
            </Button>
          </>
        }
      />
      <div className="mb-5 flex items-center justify-between rounded-lg border p-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Bulan sebelumnya"
          onClick={() => moveMonth(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="font-semibold capitalize">
          {period.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Bulan berikutnya"
          onClick={() => moveMonth(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Total anggaran", query.data?.totalBudget ?? 0],
              ["Terpakai", query.data?.totalSpent ?? 0],
              ["Sisa anggaran", query.data?.totalRemaining ?? 0],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-muted-foreground text-sm">{label}</CardTitle>
                </CardHeader>
                <CardContent className="text-xl font-bold">
                  {formatCurrency(value as number)}
                </CardContent>
              </Card>
            ))}
          </div>
          {alerts.length > 0 && (
            <Alert
              variant={
                alerts.some((item) => item.status === "melebihi") ? "destructive" : "default"
              }
              className="mb-5"
            >
              <AlertTitle>Perhatian anggaran</AlertTitle>
              <AlertDescription>
                {alerts.map((item) => `${item.category.name} ${item.percent}%`).join(" · ")}
              </AlertDescription>
            </Alert>
          )}
          {!items.length ? (
            <EmptyState
              title="Belum ada anggaran untuk bulan ini"
              description="Buat anggaran atau salin anggaran dari bulan sebelumnya."
              action={<Button onClick={() => start()}>Tambah Anggaran</Button>}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((budget) => (
                <Card
                  key={budget.id}
                  className={`cursor-pointer transition hover:shadow-md ${selectedCategoryId === budget.categoryId ? "ring-primary ring-2" : ""}`}
                  onClick={() => setSelectedCategoryId(budget.categoryId)}
                >
                  <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CategoryIcon
                        name={budget.category.icon}
                        color={budget.category.color}
                        className="size-8"
                      />
                      {budget.category.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ubah anggaran ${budget.category.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          start(budget);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Hapus anggaran ${budget.category.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          void remove(budget);
                        }}
                      >
                        <span className="text-destructive">×</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span>{formatCurrency(budget.spent)} terpakai</span>
                      <span>{formatCurrency(budget.amount)} anggaran</span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${statusColor[budget.status]}`}
                        style={{ width: `${Math.min(100, Math.max(0, budget.percent))}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {budget.percent}% · {formatCurrency(budget.remaining)} tersisa
                      </span>
                      <span className="font-medium">{statusLabel[budget.status]}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                Riwayat anggaran{selectedCategory ? ` · ${selectedCategory.name}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {selectedCategoryId && history.data?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history.data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat("id-ID", { notation: "compact" }).format(value)
                      }
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="budget" name="Anggaran" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Terpakai" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  Pilih kategori yang memiliki anggaran untuk melihat riwayat 6 bulan.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Anggaran" : "Tambah Anggaran"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void save(event)}>
            <div className="space-y-1">
              <Label>Kategori pengeluaran</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={Boolean(editing)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Jumlah anggaran</Label>
              <MoneyInput value={amount} onChange={setAmount} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="budget-threshold">Ambang peringatan (%)</Label>
              <Input
                id="budget-threshold"
                type="number"
                min={1}
                max={100}
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="budget-note">Catatan</Label>
              <Input
                id="budget-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <Button className="w-full" type="submit">
              Simpan Anggaran
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
