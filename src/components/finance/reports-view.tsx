"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import {
  useCashflowReport,
  useCategoryReport,
  useNetWorthReport,
  useReportSummary,
} from "@/hooks/use-reports";
import { getPeriodRange, type PeriodPreset } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import { StatCard } from "@/components/shared/stat-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function ExportButtons({ from, to }: { from: string; to: string }) {
  function download(format: "csv" | "xlsx" | "pdf") {
    const params = new URLSearchParams({ format, scope: "report", from, to });
    window.location.href = `/api/export?${params.toString()}`;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => download("csv")}>
        <Download className="mr-2 size-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => download("xlsx")}>
        <Download className="mr-2 size-4" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => download("pdf")}>
        <Download className="mr-2 size-4" /> PDF
      </Button>
    </div>
  );
}

export function ReportsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRange = useMemo(() => getPeriodRange("month"), []);
  const from = searchParams.get("from") || toDateInput(currentRange.from);
  const to = searchParams.get("to") || toDateInput(currentRange.to);
  const allowedPresets: PeriodPreset[] = ["today", "week", "month", "year", "custom"];
  const rawPreset = searchParams.get("period") as PeriodPreset | null;
  const preset = rawPreset && allowedPresets.includes(rawPreset) ? rawPreset : "month";
  const [categoryType, setCategoryType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const summary = useReportSummary(from, to);
  const cashflow = useCashflowReport(from, to);
  const categories = useCategoryReport(from, to, categoryType);
  const networth = useNetWorthReport(12);
  const palette = ["#14b8a6", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"];

  function updateUrl(nextPreset: PeriodPreset, nextFrom = from, nextTo = to) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", nextPreset);
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function changePreset(nextPreset: PeriodPreset) {
    if (nextPreset === "custom") {
      updateUrl(nextPreset);
      return;
    }
    const range = getPeriodRange(nextPreset);
    updateUrl(nextPreset, toDateInput(range.from), toDateInput(range.to));
  }

  function changeCustomRange(range: { from: string; to: string }) {
    updateUrl("custom", range.from || from, range.to || to);
  }

  const exportFrom = from;
  const exportTo = to;

  return (
    <>
      <PageHeader title="Laporan" description="Pahami tren dan pola keuangan Anda." />
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PeriodFilter
            value={preset}
            onChange={changePreset}
            from={from}
            to={to}
            onRangeChange={changeCustomRange}
          />
          <ExportButtons from={exportFrom} to={exportTo} />
        </div>
        <Tabs defaultValue="summary" className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="summary">Ringkasan</TabsTrigger>
            <TabsTrigger value="cashflow">Arus Kas</TabsTrigger>
            <TabsTrigger value="category">Kategori</TabsTrigger>
            <TabsTrigger value="trend">Tren</TabsTrigger>
            <TabsTrigger value="networth">Net Worth</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            {summary.isLoading ? (
              <LoadingState rows={4} />
            ) : summary.isError || !summary.data ? (
              <ErrorState onRetry={() => void summary.refetch()} />
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard title="Kekayaan bersih" amount={summary.data.netWorth} icon={Wallet} />
                  <StatCard
                    title="Pemasukan"
                    amount={summary.data.income}
                    icon={ArrowDownLeft}
                    tone="emerald"
                    change={summary.data.changes.income}
                  />
                  <StatCard
                    title="Pengeluaran"
                    amount={summary.data.expense}
                    icon={ArrowUpRight}
                    tone="rose"
                    change={summary.data.changes.expense}
                  />
                  <StatCard
                    title="Arus kas bersih"
                    amount={summary.data.net}
                    icon={Wallet}
                    tone={summary.data.net >= 0 ? "emerald" : "amber"}
                    change={summary.data.changes.net}
                  />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Perbandingan periode sebelumnya</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
                    <p>
                      Pemasukan sebelumnya: <Money amount={summary.data.previous.income} />
                    </p>
                    <p>
                      Pengeluaran sebelumnya: <Money amount={summary.data.previous.expense} />
                    </p>
                    <p>
                      Arus kas sebelumnya: <Money amount={summary.data.previous.net} />
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          <TabsContent value="cashflow">
            {cashflow.isLoading ? (
              <LoadingState rows={4} />
            ) : cashflow.isError ? (
              <ErrorState onRetry={() => void cashflow.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Pemasukan, pengeluaran, dan saldo berjalan
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashflow.data?.items || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis
                        tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`}
                      />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line dataKey="income" name="Pemasukan" stroke="#14b8a6" />
                      <Line dataKey="expense" name="Pengeluaran" stroke="#f43f5e" />
                      <Line dataKey="runningNet" name="Saldo berjalan" stroke="#3b82f6" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="category">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Rincian kategori</h2>
              <Select
                value={categoryType}
                onValueChange={(value) => setCategoryType(value as typeof categoryType)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                  <SelectItem value="INCOME">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {categories.isLoading ? (
              <LoadingState rows={4} />
            ) : categories.isError ? (
              <ErrorState onRetry={() => void categories.refetch()} />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardContent className="h-80 pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories.data?.items || []}
                          dataKey="amount"
                          nameKey="name"
                          innerRadius={65}
                          outerRadius={110}
                        >
                          {categories.data?.items.map((item, index) => (
                            <Cell
                              key={item.categoryId || item.name}
                              fill={item.color || palette[index % palette.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Kategori · <Money amount={categories.data?.total || 0} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categories.data?.items.map((item) => (
                      <div key={item.categoryId || item.name} className="flex items-center gap-3">
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="flex-1">{item.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {item.percent.toFixed(1)}%
                        </span>
                        <span className="font-medium">
                          <Money amount={item.amount} />
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          <TabsContent value="trend">
            {cashflow.isLoading ? (
              <LoadingState rows={4} />
            ) : cashflow.isError ? (
              <ErrorState onRetry={() => void cashflow.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tren arus kas</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashflow.data?.items || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis
                        tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`}
                      />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="income" name="Pemasukan" fill="#14b8a6" radius={[5, 5, 0, 0]} />
                      <Bar
                        dataKey="expense"
                        name="Pengeluaran"
                        fill="#f43f5e"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="networth">
            {networth.isLoading ? (
              <LoadingState rows={4} />
            ) : networth.isError ? (
              <ErrorState onRetry={() => void networth.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Perkembangan kekayaan bersih</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={networth.data?.items || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis
                        tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`}
                      />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="assets" name="Aset" fill="#14b8a6" />
                      <Bar dataKey="liabilities" name="Liabilitas" fill="#f43f5e" />
                      <Bar dataKey="netWorth" name="Net worth" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
