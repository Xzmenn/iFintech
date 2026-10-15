"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  useAccounts,
  useCategories,
  useTransactions,
  type FinanceTransaction,
} from "@/hooks/use-finance";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { RecurringList } from "@/components/finance/recurring-list";
import { TransactionFilters } from "@/components/finance/transaction-filters";
import { TransactionFormDialog } from "@/components/finance/transaction-form-dialog";
import { TransactionListMobile } from "@/components/finance/transaction-list-mobile";
import { TransactionTable } from "@/components/finance/transaction-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TransactionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const params = new URLSearchParams(searchParams.toString());
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);
  const [preset, setPreset] = useState<{
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    accountId?: string;
  }>({});
  const transactions = useTransactions(params);
  const accounts = useAccounts();
  const categories = useCategories();

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (search === (searchParams.get("q") || "")) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      next.set("page", "1");
      router.replace(`${pathname}?${next.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, router, search, searchParams]);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    const requestedType = searchParams.get("type");
    setPreset({
      type: requestedType === "INCOME" || requestedType === "TRANSFER" ? requestedType : "EXPENSE",
      accountId: searchParams.get("accountId") || undefined,
    });
    setEditing(null);
    setDialog(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("new");
    router.replace(`${pathname}?${next.toString()}`);
  }, [pathname, router, searchParams]);

  const setParams = useCallback(
    (changes: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!("page" in changes)) next.set("page", "1");
      router.replace(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams],
  );
  const setParam = useCallback(
    (key: string, value: string) => setParams({ [key]: value }),
    [setParams],
  );

  const onSortingChange = useCallback(
    (sorting: SortingState) => {
      const next = new URLSearchParams(searchParams.toString());
      const sort = sorting[0]?.id === "amount" ? "amount" : "date";
      next.set("sort", sort);
      next.set("order", sorting[0]?.desc ? "desc" : "asc");
      next.set("page", "1");
      router.replace(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!window.confirm("Hapus transaksi ini? Saldo akun akan dihitung ulang.")) return;
      try {
        await apiClient(`/api/transactions/${id}`, { method: "DELETE" });
        await client.invalidateQueries({ queryKey: ["transactions"] });
        await client.invalidateQueries({ queryKey: ["accounts"] });
        toast.success("Transaksi dihapus");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Transaksi gagal dihapus");
      }
    },
    [client],
  );

  async function refreshAfterSave() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["transactions"] }),
      client.invalidateQueries({ queryKey: ["accounts"] }),
      client.invalidateQueries({ queryKey: ["recurring"] }),
      client.invalidateQueries({ queryKey: ["budgets"] }),
      client.invalidateQueries({ queryKey: ["reports"] }),
    ]);
  }

  function edit(transaction: FinanceTransaction) {
    setEditing(transaction);
    setDialog(true);
  }

  function addTransaction() {
    setPreset({});
    setEditing(null);
    setDialog(true);
  }

  const filterProps = {
    params,
    search,
    accounts: accounts.data?.items || [],
    categories: categories.data || [],
    onSearchChange: setSearch,
    onChange: setParam,
    onChangeMany: setParams,
    onReset: () => {
      setSearch("");
      router.replace(pathname);
    },
  };

  return (
    <>
      <PageHeader
        title="Transaksi"
        description="Catat dan telusuri semua pemasukan, pengeluaran, dan transfer."
        actions={<Button onClick={addTransaction}>Tambah Transaksi</Button>}
      />
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Semua Transaksi</TabsTrigger>
          <TabsTrigger value="recurring">Transaksi Berulang</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="space-y-4">
          <TransactionFilters {...filterProps} />
          {transactions.isLoading ? (
            <LoadingState />
          ) : transactions.isError ? (
            <ErrorState onRetry={() => void transactions.refetch()} />
          ) : !transactions.data?.items.length ? (
            <EmptyState
              title="Belum ada transaksi"
              description="Tambahkan transaksi untuk mulai melacak keuangan."
              action={<Button onClick={addTransaction}>Tambah Transaksi</Button>}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <TransactionTable
                  transactions={transactions.data.items}
                  page={transactions.data.page || 1}
                  pageSize={transactions.data.pageSize}
                  total={transactions.data.total}
                  onPageChange={(page) => setParam("page", String(page))}
                  onSortingChange={onSortingChange}
                  onEdit={edit}
                  onDelete={(id) => void remove(id)}
                />
              </div>
              <TransactionListMobile
                transactions={transactions.data.items}
                onEdit={edit}
                onDelete={(id) => void remove(id)}
              />
            </>
          )}
        </TabsContent>
        <TabsContent value="recurring">
          <RecurringList />
        </TabsContent>
      </Tabs>
      <TransactionFormDialog
        open={dialog}
        onOpenChange={setDialog}
        transaction={editing}
        preset={preset}
        onSaved={refreshAfterSave}
      />
    </>
  );
}
