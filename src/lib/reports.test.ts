import { describe, expect, it } from "vitest";
import { bucketCashflow, reconstructNetWorth } from "@/lib/reports";

describe("bucketCashflow", () => {
  it("groups daily transactions and calculates running net without transfers", () => {
    const result = bucketCashflow(
      [
        { type: "INCOME", amount: 1000, date: "2026-01-01T12:00:00.000Z" },
        { type: "EXPENSE", amount: 250, date: "2026-01-02T12:00:00.000Z" },
        { type: "TRANSFER", amount: 500, date: "2026-01-02T12:00:00.000Z" },
      ],
      "2026-01-01T00:00:00.000Z",
      "2026-01-03T23:59:59.000Z",
    );
    expect(result.bucket).toBe("day");
    expect(result.items).toHaveLength(3);
    expect(result.items[1]).toMatchObject({ income: 0, expense: 250, net: -250, runningNet: 750 });
  });

  it("uses weekly buckets for ranges up to 180 days", () => {
    const result = bucketCashflow([], "2026-01-01", "2026-04-01");
    expect(result.bucket).toBe("week");
    expect(result.items.length).toBeGreaterThan(10);
  });

  it("uses monthly buckets for ranges longer than 180 days", () => {
    const result = bucketCashflow([], "2025-01-01", "2026-01-01");
    expect(result.bucket).toBe("month");
    expect(result.items).toHaveLength(13);
  });
});

describe("reconstructNetWorth", () => {
  it("reconstructs monthly assets, liabilities, transfers and current balances", () => {
    const series = reconstructNetWorth(
      [
        { id: "bank", initialBalance: 1000, balance: 850 },
        { id: "card", initialBalance: -100, balance: -50 },
      ],
      [
        {
          type: "EXPENSE",
          amount: 100,
          date: "2026-01-15T00:00:00.000Z",
          accountId: "bank",
        },
        {
          type: "TRANSFER",
          amount: 50,
          date: "2026-02-02T00:00:00.000Z",
          accountId: "bank",
          toAccountId: "card",
        },
      ],
      3,
      new Date(2026, 2, 15),
    );
    expect(series[0]).toMatchObject({ assets: 900, liabilities: 100, netWorth: 800 });
    expect(series[1]).toMatchObject({ assets: 850, liabilities: 50, netWorth: 800 });
    expect(series[2]).toMatchObject({ assets: 850, liabilities: 50, netWorth: 800 });
  });
});
