"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";

export type UserSettings = {
  id: string;
  userId: string;
  currency: "IDR" | "USD" | "SGD" | "EUR" | "MYR";
  locale: "id-ID" | "en-US";
  theme: "light" | "dark" | "system";
  weekStartsOn: 0 | 1;
  budgetAlertThreshold: number;
};

export const defaultSettings: UserSettings = {
  id: "",
  userId: "",
  currency: "IDR",
  locale: "id-ID",
  theme: "system",
  weekStartsOn: 1,
  budgetAlertThreshold: 80,
};

export const settingsQueryKey = ["settings"] as const;
const SettingsContext = createContext<UserSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const { status } = useSession();
  const query = useQuery({
    queryKey: settingsQueryKey,
    queryFn: () => apiClient<UserSettings>("/api/settings"),
    enabled: status === "authenticated",
  });
  const settings = query.data || defaultSettings;

  useEffect(() => {
    if (query.data?.theme) setTheme(query.data.theme);
  }, [query.data?.theme, setTheme]);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useCurrencyFormatter() {
  const settings = useSettings();
  return (amount: number | string | { toNumber: () => number }) =>
    formatCurrency(amount, settings.currency, settings.locale);
}
