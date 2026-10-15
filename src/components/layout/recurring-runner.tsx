"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export function RecurringRunner() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("ifintech-recurring-run")) return;
      sessionStorage.setItem("ifintech-recurring-run", "1");
    } catch {
      return;
    }
    void apiClient<{ created: number; failed: unknown[] }>("/api/recurring/run", { method: "POST" })
      .then(({ created, failed }) => {
        if (created > 0 || failed.length > 0) {
          toast.info(
            `${created} transaksi berulang dibuat${failed.length ? ` · ${failed.length} gagal` : ""}`,
          );
        }
      })
      .catch(() => undefined);
  }, []);
  return null;
}
