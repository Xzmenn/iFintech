"use client";

import type { PeriodPreset } from "@/lib/dates";
import { getPeriodRange } from "@/lib/dates";
import type { Account, Category } from "@/hooks/use-finance";
import { PeriodFilter } from "@/components/shared/period-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TransactionFilters({
  params,
  search,
  accounts,
  categories,
  onSearchChange,
  onChange,
  onChangeMany,
  onReset,
}: {
  params: URLSearchParams;
  search: string;
  accounts: Account[];
  categories: Category[];
  onSearchChange: (value: string) => void;
  onChange: (key: string, value: string) => void;
  onChangeMany: (values: Record<string, string>) => void;
  onReset: () => void;
}) {
  const period =
    (params.get("period") as PeriodPreset | null) ||
    (params.get("from") || params.get("to") ? "custom" : "month");
  const from = params.get("from")?.slice(0, 10) || "";
  const to = params.get("to")?.slice(0, 10) || "";
  const expenseCategories = categories.filter((category) => category.type === "EXPENSE");
  const incomeCategories = categories.filter((category) => category.type === "INCOME");

  function setPeriod(next: PeriodPreset) {
    if (next === "custom") {
      onChangeMany({ period: next });
      return;
    }
    const range = getPeriodRange(next);
    onChangeMany({
      period: next,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });
  }

  function setCustomRange(range: { from: string; to: string }) {
    onChangeMany({
      from: range.from ? new Date(`${range.from}T00:00:00`).toISOString() : "",
      to: range.to ? new Date(`${range.to}T23:59:59`).toISOString() : "",
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          value={search}
          placeholder="Cari transaksi..."
          aria-label="Cari transaksi"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <PeriodFilter
          value={period}
          from={from}
          to={to}
          onChange={setPeriod}
          onRangeChange={setCustomRange}
        />
        <Select
          value={params.get("type") || "all"}
          onValueChange={(value) => onChange("type", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua jenis</SelectItem>
            <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
            <SelectItem value="INCOME">Pemasukan</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.get("accountId") || "all"}
          onValueChange={(value) => onChange("accountId", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua akun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua akun</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.get("categoryId") || "all"}
          onValueChange={(value) => onChange("categoryId", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {expenseCategories.length > 0 && (
              <SelectGroup>
                <SelectLabel>Pengeluaran</SelectLabel>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {incomeCategories.length > 0 && (
              <SelectGroup>
                <SelectLabel>Pemasukan</SelectLabel>
                {incomeCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min="0"
          value={params.get("minAmount") || ""}
          placeholder="Jumlah minimum"
          aria-label="Jumlah minimum"
          onChange={(event) => onChange("minAmount", event.target.value)}
        />
        <Input
          type="number"
          min="0"
          value={params.get("maxAmount") || ""}
          placeholder="Jumlah maksimum"
          aria-label="Jumlah maksimum"
          onChange={(event) => onChange("maxAmount", event.target.value)}
        />
        <Button variant="outline" onClick={onReset}>
          Reset filter
        </Button>
      </div>
    </div>
  );
}
