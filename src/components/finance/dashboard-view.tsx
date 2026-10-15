"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAccounts, useGoals } from "@/hooks/use-finance";
import { useCashflowReport, useCategoryReport, useReportSummary } from "@/hooks/use-reports";
import { formatDate } from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/use-settings";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatQueryDate(date: Date) {
  return date.toISOString();
}

export function DashboardView() {
  const formatCurrency = useCurrencyFormatter();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const summary = useReportSummary(formatQueryDate(monthStart), formatQueryDate(now));
  const cashflow = useCashflowReport(formatQueryDate(monthStart), formatQueryDate(now));
  const categories = useCategoryReport(
    formatQueryDate(monthStart),
    formatQueryDate(now),
    "EXPENSE",
  );
  const trends = useCashflowReport(formatQueryDate(sixMonthStart), formatQueryDate(now));
  const accounts = useAccounts();
  const goals = useGoals();
  const colors = useMemo(
    () => ["#14b8a6", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"],
    [],
  );

  if (summary.isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Ringkasan kondisi keuangan Anda." />
        <LoadingState rows={6} />
      </>
    );
  }
  if (summary.isError || !summary.data) {
    return (
      <>
        <PageHeader title="Dashboard" description="Ringkasan kondisi keuangan Anda." />
        <ErrorState onRetry={() => void summary.refetch()} />
      </>
    );
  }

  const isNewUser =
    summary.data.recentTransactions.length === 0 &&
    (accounts.data?.items.length || 0) === 0 &&
    (goals.data?.length || 0) === 0;

  if (isNewUser) {
    return (
      <>
        <PageHeader title="Dashboard" description="Ringkasan kondisi keuangan Anda." />
        <EmptyState
          title="Mulai kelola keuangan Anda"
          description="Tambahkan akun dan transaksi pertama untuk melihat ringkasan keuangan di sini."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/accounts">
                  <Plus className="mr-2 size-4" />
                  Tambah akun
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/transactions">Tambah transaksi</Link>
              </Button>
            </div>
          }
        />
      </>
    );
  }

  const accountItems = accounts.data?.items || [];
  const goalItems = goals.data || [];
  const expenseItems = categories.data?.items || [];

  return (
    <>
      <PageHeader title="Dashboard" description="Ringkasan kondisi keuangan Anda." />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total kekayaan bersih"
            amount={summary.data.netWorth}
            icon={Wallet}
            tone="primary"
          />
          <StatCard
            title="Pemasukan bulan ini"
            amount={summary.data.income}
            icon={ArrowDownLeft}
            tone="emerald"
            change={summary.data.changes.income}
          />
          <StatCard
            title="Pengeluaran bulan ini"
            amount={summary.data.expense}
            icon={ArrowUpRight}
            tone="rose"
            change={summary.data.changes.expense}
          />
          <StatCard
            title="Arus kas bersih"
            amount={summary.data.net}
            icon={Landmark}
            tone={summary.data.net >= 0 ? "emerald" : "amber"}
            change={summary.data.changes.net}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Arus kas bulan ini</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {cashflow.isLoading ? (
                <LoadingState rows={2} />
              ) : cashflow.isError ? (
                <ErrorState onRetry={() => void cashflow.refetch()} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflow.data?.items || []} margin={{ left: 4, right: 12 }}>
                    <defs>
                      <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Pemasukan"
                      stroke="#14b8a6"
                      fill="url(#incomeFill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Pengeluaran"
                      stroke="#f43f5e"
                      fill="url(#expenseFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Pengeluaran per kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.isLoading ? (
                <LoadingState rows={3} />
              ) : categories.isError ? (
                <ErrorState onRetry={() => void categories.refetch()} />
              ) : expenseItems.length === 0 ? (
                <p className="text-muted-foreground py-16 text-center text-sm">
                  Belum ada pengeluaran pada periode ini.
                </p>
              ) : (
                <div className="grid items-center gap-4 sm:grid-cols-2">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseItems}
                          dataKey="amount"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={78}
                          paddingAngle={3}
                        >
                          {expenseItems.map((item, index) => (
                            <Cell
                              key={item.categoryId || item.name}
                              fill={item.color || colors[index % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {expenseItems.slice(0, 5).map((item, index) => (
                      <div key={item.categoryId || item.name} className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color || colors[index % colors.length] }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {item.percent.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Pemasukan vs pengeluaran · 6 bulan</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {trends.isLoading ? (
                <LoadingState rows={2} />
              ) : trends.isError ? (
                <ErrorState onRetry={() => void trends.refetch()} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends.data?.items || []} margin={{ left: 4, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
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
              )}
            </CardContent>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Peringatan anggaran</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/budgets">Lihat semua</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.data.budgetAlerts.length === 0 ? (
                <p className="text-muted-foreground py-5 text-center text-sm">
                  Tidak ada kategori yang mendekati batas anggaran.
                </p>
              ) : (
                summary.data.budgetAlerts.map((budget) => (
                  <div
                    key={budget.id}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div>
                      <p className="font-medium">{budget.category.name}</p>
                      <p className="text-muted-foreground text-xs">
                        <Money amount={budget.spent} /> dari <Money amount={budget.amount} />
                      </p>
                    </div>
                    <Badge variant={budget.status === "melebihi" ? "destructive" : "secondary"}>
                      {budget.status === "melebihi" ? "Melebihi" : "Peringatan"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Target keuangan</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/goals">Lihat semua</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {goals.isLoading ? (
                <LoadingState rows={2} />
              ) : goals.isError ? (
                <ErrorState onRetry={() => void goals.refetch()} />
              ) : goalItems.length === 0 ? (
                <p className="text-muted-foreground py-5 text-center text-sm">
                  Belum ada target yang dibuat.
                </p>
              ) : (
                goalItems.slice(0, 4).map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="truncate font-medium">{goal.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {goal.percent.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={goal.percent} />
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <Money amount={goal.saved} />
                      <Money amount={goal.targetAmount} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transaksi terbaru</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/transactions">Lihat semua</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {summary.data.recentTransactions.length === 0 ? (
                <p className="text-muted-foreground py-5 text-center text-sm">
                  Belum ada transaksi.
                </p>
              ) : (
                summary.data.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {transaction.note || transaction.category?.name || "Transaksi"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(transaction.date)} · {transaction.account.name}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        transaction.type === "INCOME"
                          ? "text-emerald-600"
                          : transaction.type === "EXPENSE"
                            ? "text-rose-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {transaction.type === "INCOME"
                        ? "+"
                        : transaction.type === "EXPENSE"
                          ? "−"
                          : ""}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Akun</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/accounts">Kelola akun</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {accountItems.slice(0, 8).map((account) => (
              <div key={account.id} className="rounded-xl border p-4">
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="mt-2 text-lg font-semibold">
                  <Money amount={account.balance} />
                </p>
                <p className="text-muted-foreground text-xs">{account.type}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
