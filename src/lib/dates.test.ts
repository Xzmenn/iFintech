import { describe, expect, it } from "vitest";
import { getPeriodRange, withTransactionDateRange } from "@/lib/dates";

describe("getPeriodRange", () => {
  it("returns local day boundaries", () => {
    const now = new Date(2025, 4, 15, 12);
    const range = getPeriodRange("today", now);
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getHours()).toBe(23);
    expect(range.from.getDate()).toBe(15);
    expect(range.to.getDate()).toBe(15);
  });

  it("uses Monday as the default week start", () => {
    const now = new Date(2025, 4, 15);
    const range = getPeriodRange("week", now);
    expect(range.from.getDay()).toBe(1);
    expect(range.to.getDay()).toBe(0);
  });

  it("adds the current-month range to transaction requests without mutating URL params", () => {
    const params = new URLSearchParams("q=groceries&page=2");
    const now = new Date(2025, 4, 15, 12);
    const expected = getPeriodRange("month", now);

    const query = withTransactionDateRange(params, now);

    expect(query.get("from")).toBe(expected.from.toISOString());
    expect(query.get("to")).toBe(expected.to.toISOString());
    expect(query.get("q")).toBe("groceries");
    expect(params.toString()).toBe("q=groceries&page=2");
  });

  it("uses the selected preset when its range is missing", () => {
    const now = new Date(2025, 4, 15, 12);
    const expected = getPeriodRange("week", now);

    const query = withTransactionDateRange(new URLSearchParams("period=week"), now);

    expect(query.get("from")).toBe(expected.from.toISOString());
    expect(query.get("to")).toBe(expected.to.toISOString());
  });
});
