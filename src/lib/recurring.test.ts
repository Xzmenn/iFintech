import { describe, expect, it } from "vitest";
import { getNextRunDate } from "@/lib/recurring";

describe("getNextRunDate", () => {
  it("clamps a month-end date to February's last day", () => {
    expect(getNextRunDate(new Date(2025, 0, 31), "MONTHLY", 1)).toEqual(new Date(2025, 1, 28));
    expect(getNextRunDate(new Date(2024, 0, 31), "MONTHLY", 1)).toEqual(new Date(2024, 1, 29));
  });

  it("applies weekly intervals", () => {
    expect(getNextRunDate(new Date(2025, 0, 1), "WEEKLY", 2)).toEqual(new Date(2025, 0, 15));
  });

  it("clamps a leap-day yearly recurrence", () => {
    expect(getNextRunDate(new Date(2024, 1, 29), "YEARLY", 1)).toEqual(new Date(2025, 1, 28));
  });
});
