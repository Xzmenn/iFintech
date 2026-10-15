"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type Account = {
  id: string; name: string; type: string; balance: number; initialBalance: number;
  creditLimit: number | null; color: string; icon: string; note: string | null; isArchived: boolean;
};
export type Category = {
  id: string; name: string; type: "INCOME" | "EXPENSE" | "TRANSFER"; icon: string; color: string;
  subCategories: { id: string; name: string }[];
};
export type FinanceTransaction = {
  id: string; type: "INCOME" | "EXPENSE" | "TRANSFER"; amount: number; date: string; note: string | null;
  account: Account; toAccount: Account | null; category: Category | null; subCategory: { name: string } | null;
  tags: { tag: { id: string; name: string } }[]; attachments: { id: string; fileName: string }[];
};

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient<{ items: Account[]; netWorth: number }>("/api/accounts?includeArchived=true"),
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
    queryFn: () => apiClient<{ items: FinanceTransaction[]; total: number; page: number; pageSize: number }>(
      `/api/transactions${query ? `?${query}` : ""}`,
    ),
  });
}

export function useRecurring() {
  return useQuery({
    queryKey: ["recurring"],
    queryFn: () => apiClient<Array<{
      id: string; type: string; amount: number; nextRunDate: string; frequency: string;
      interval: number; isActive: boolean; note: string | null; account: Account;
    }>>("/api/recurring"),
  });
}
