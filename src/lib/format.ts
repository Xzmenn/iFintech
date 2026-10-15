import { format as dateFormat } from "date-fns";
import { id } from "date-fns/locale";

export function formatCurrency(
  amount: number | string | { toNumber: () => number },
  currency = "IDR",
  locale = "id-ID",
) {
  const value = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(value);
}

export function formatDate(date: Date | string, pattern = "d MMMM yyyy") {
  return dateFormat(typeof date === "string" ? new Date(date) : date, pattern, {
    locale: id,
  });
}
