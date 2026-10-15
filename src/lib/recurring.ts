import { addDays, addMonths, addWeeks, addYears } from "date-fns";

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export function getNextRunDate(date: Date, frequency: RecurringFrequency, interval: number) {
  const steps = Math.max(1, Math.floor(interval));
  switch (frequency) {
    case "DAILY":
      return addDays(date, steps);
    case "WEEKLY":
      return addWeeks(date, steps);
    case "MONTHLY":
      return addMonths(date, steps);
    case "YEARLY":
      return addYears(date, steps);
  }
}
