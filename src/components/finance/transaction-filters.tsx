"use client";

import { type ReactNode, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { PeriodPreset } from "@/lib/dates";
import { getPeriodRange } from "@/lib/dates";
import type { Account, Category } from "@/hooks/use-finance";
import { PeriodFilter } from "@/components/shared/period-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    period !== "month" ? period : "",
    params.get("type"),
    params.get("accountId"),
    params.get("categoryId"),
    params.get("minAmount"),
    params.get("maxAmount"),
  ].filter(Boolean).length;
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

  function field(label: string, control: ReactNode, showLabel: boolean) {
    return showLabel ? (
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">{label}</Label>
        {control}
      </div>
    ) : (
      control
    );
  }

  function renderFilters(showLabels = false) {
    const periodFilter = (
      <PeriodFilter
        value={period}
        from={from}
        to={to}
        onChange={setPeriod}
        onRangeChange={setCustomRange}
        triggerClassName={showLabels ? "w-full" : undefined}
      />
    );
    const typeFilter = (
      <Select
        value={params.get("type") || "all"}
        onValueChange={(value) => onChange("type", value === "all" ? "" : value)}
      >
        <SelectTrigger className={showLabels ? "w-full" : undefined}>
          <SelectValue placeholder="Semua jenis" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua jenis</SelectItem>
          <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
          <SelectItem value="INCOME">Pemasukan</SelectItem>
          <SelectItem value="TRANSFER">Transfer</SelectItem>
        </SelectContent>
      </Select>
    );
    const accountFilter = (
      <Select
        value={params.get("accountId") || "all"}
        onValueChange={(value) => onChange("accountId", value === "all" ? "" : value)}
      >
        <SelectTrigger className={showLabels ? "w-full" : undefined}>
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
    );
    const categoryFilter = (
      <Select
        value={params.get("categoryId") || "all"}
        onValueChange={(value) => onChange("categoryId", value === "all" ? "" : value)}
      >
        <SelectTrigger className={showLabels ? "w-full" : undefined}>
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
    );
    const minAmount = (
      <Input
        type="number"
        min="0"
        value={params.get("minAmount") || ""}
        placeholder="Jumlah minimum"
        aria-label="Jumlah minimum"
        className={showLabels ? "w-full" : undefined}
        onChange={(event) => onChange("minAmount", event.target.value)}
      />
    );
    const maxAmount = (
      <Input
        type="number"
        min="0"
        value={params.get("maxAmount") || ""}
        placeholder="Jumlah maksimum"
        aria-label="Jumlah maksimum"
        className={showLabels ? "w-full" : undefined}
        onChange={(event) => onChange("maxAmount", event.target.value)}
      />
    );
    const amounts = showLabels ? (
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Jumlah</Label>
        <div className="grid gap-2">
          {minAmount}
          {maxAmount}
        </div>
      </div>
    ) : (
      <>
        {minAmount}
        {maxAmount}
      </>
    );

    return (
      <>
        {field("Periode", periodFilter, showLabels)}
        {field("Jenis", typeFilter, showLabels)}
        {field("Akun", accountFilter, showLabels)}
        {field("Kategori", categoryFilter, showLabels)}
        {amounts}
      </>
    );
  }

  const filters = renderFilters();
  const mobileFilters = renderFilters(true);

  return (
    <div className="space-y-3">
      <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
        <Input
          value={search}
          placeholder="Cari transaksi..."
          aria-label="Cari transaksi"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {filters}
        <Button variant="outline" onClick={onReset}>
          Reset filter
        </Button>
      </div>
      <div className="flex gap-2 md:hidden">
        <Input
          value={search}
          placeholder="Cari transaksi..."
          aria-label="Cari transaksi"
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-w-0 flex-1"
        />
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <SlidersHorizontal className="size-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="!w-[min(92vw,420px)]">
            <SheetHeader>
              <SheetTitle>Filter transaksi</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              <div className="grid gap-4 pb-4">{mobileFilters}</div>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 border-t p-4">
              <Button
                variant="outline"
                onClick={() => {
                  onReset();
                }}
              >
                Reset filter
              </Button>
              <Button onClick={() => setFiltersOpen(false)}>Terapkan</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
