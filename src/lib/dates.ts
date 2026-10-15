import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

export type PeriodPreset = "today" | "week" | "month" | "year" | "custom";

export function getPeriodRange(
  preset: PeriodPreset,
  now = new Date(),
  weekStartsOn: 0 | 1 = 1,
  custom?: { from: Date; to: Date },
) {
  if (preset === "custom" && custom) {
    return { from: startOfDay(custom.from), to: endOfDay(custom.to) };
  }
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return {
        from: startOfWeek(now, { weekStartsOn }),
        to: endOfWeek(now, { weekStartsOn }),
      };
    case "year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "custom":
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

export function withTransactionDateRange(params: URLSearchParams, now = new Date()) {
  const query = new URLSearchParams(params);
  if (query.has("from") || query.has("to")) return query;

  const value = query.get("period");
  const preset: PeriodPreset | null =
    value === null
      ? "month"
      : value === "today" ||
          value === "week" ||
          value === "month" ||
          value === "year" ||
          value === "custom"
        ? value
        : null;
  if (!preset || preset === "custom") return query;

  const range = getPeriodRange(preset, now);
  query.set("from", range.from.toISOString());
  query.set("to", range.to.toISOString());
  return query;
}
