"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  initialBalance: number;
  creditLimit: number | null;
  color: string;
  icon: string;
  note: string | null;
  isArchived: boolean;
};
export type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  icon: string;
  color: string;
  subCategories: { id: string; name: string }[];
};
export type FinanceTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: string;
  note: string | null;
  account: Account;
  toAccount: Account | null;
  category: Category | null;
  subCategory: { name: string } | null;
  tags: { tag: { id: string; name: string } }[];
  attachments: { id: string; fileName: string }[];
};

export type Budget = {
  id: string;
  categoryId: string;
  year: number;
  month: number;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  status: "aman" | "peringatan" | "melebihi";
  alertThreshold: number;
  note: string | null;
  category: Category;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  saved: number;
  percent: number;
  remaining: number;
  monthlyAverage: number;
  estimatedDate: string | null;
  requiredPerMonth: number | null;
  onTrack: boolean;
  deadline: string | null;
  accountId: string | null;
  account: Account | null;
  color: string;
  icon: string;
  note: string | null;
  isCompleted: boolean;
  contributions: {
    id: string;
    amount: number;
    date: string;
    note: string | null;
  }[];
};

export type BudgetOverview = {
  items: Budget[];
  year: number;
  month: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
};

export function useBudgets(year: number, month: number) {
  return useQuery({
    queryKey: ["budgets", year, month],
    queryFn: () => apiClient<BudgetOverview>(`/api/budgets?year=${year}&month=${month}`),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => apiClient<Goal[]>("/api/goals"),
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () =>
      apiClient<{ items: Account[]; netWorth: number }>("/api/accounts?includeArchived=true"),
  });
}

export function useCategories(type?: string) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => apiClient<Category[]>(`/api/categories${type ? `?type=${type}` : ""}`),
  });
}

export function useTransactions(params: URLSearchParams) {
  const query = params.toString();
  return useQuery({
    queryKey: ["transactions", query],
    queryFn: () =>
      apiClient<{ items: FinanceTransaction[]; total: number; page: number; pageSize: number }>(
        `/api/transactions${query ? `?${query}` : ""}`,
      ),
  });
}

export function useRecurring() {
  return useQuery({
    queryKey: ["recurring"],
    queryFn: () =>
      apiClient<
        Array<{
          id: string;
          type: string;
          amount: number;
          nextRunDate: string;
          endDate: string | null;
          frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
          interval: number;
          isActive: boolean;
          note: string | null;
          account: Account;
        }>
      >("/api/recurring"),
  });
}
