"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type ReportTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: string;
  note: string | null;
  account: { name: string };
  toAccount: { name: string } | null;
  category: { name: string; icon: string; color: string } | null;
  subCategory: { name: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
};

export type ReportSummary = {
  from: string;
  to: string;
  netWorth: number;
  income: number;
  expense: number;
  net: number;
  changes: { income: number; expense: number; net: number };
  previous: { income: number; expense: number; net: number };
  budgetAlerts: {
    id: string;
    category: { name: string };
    status: "aman" | "peringatan" | "melebihi";
    spent: number;
    amount: number;
  }[];
  recentTransactions: ReportTransaction[];
};

export type CategoryReport = {
  type: "INCOME" | "EXPENSE";
  total: number;
  items: {
    categoryId: string | null;
    name: string;
    icon: string;
    color: string;
    amount: number;
    percent: number;
  }[];
};

export type CashflowReport = {
  bucket: "day" | "week" | "month";
  items: {
    key: string;
    label: string;
    income: number;
    expense: number;
    net: number;
    runningNet: number;
  }[];
};

export type NetWorthReport = {
  currentNetWorth: number;
  items: { month: string; label: string; assets: number; liabilities: number; netWorth: number }[];
};

function periodParams(from: string, to: string) {
  return `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export function useReportSummary(from: string, to: string) {
  return useQuery({
    queryKey: ["reports", "summary", from, to],
    queryFn: () => apiClient<ReportSummary>(`/api/reports/summary?${periodParams(from, to)}`),
  });
}

export function useCategoryReport(from: string, to: string, type: "INCOME" | "EXPENSE") {
  return useQuery({
    queryKey: ["reports", "category", from, to, type],
    queryFn: () =>
      apiClient<CategoryReport>(`/api/reports/category?${periodParams(from, to)}&type=${type}`),
  });
}

export function useCashflowReport(from: string, to: string) {
  return useQuery({
    queryKey: ["reports", "cashflow", from, to],
    queryFn: () => apiClient<CashflowReport>(`/api/reports/cashflow?${periodParams(from, to)}`),
  });
}

export function useNetWorthReport(months = 12) {
  return useQuery({
    queryKey: ["reports", "networth", months],
    queryFn: () => apiClient<NetWorthReport>(`/api/reports/networth?months=${months}`),
  });
}
