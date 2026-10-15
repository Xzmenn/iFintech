import { describe, expect, it } from "vitest";
import { transactionSchema } from "@/lib/validations/transaction";

const transfer = {
  type: "TRANSFER" as const,
  amount: 100_000,
  date: new Date("2025-01-01T00:00:00.000Z"),
  accountId: "account-a",
  toAccountId: "account-b",
};

describe("transactionSchema", () => {
  it("requires a different destination account for transfers", () => {
    expect(transactionSchema.safeParse({ ...transfer, toAccountId: undefined }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...transfer, toAccountId: "account-a" }).success).toBe(false);
    expect(transactionSchema.safeParse(transfer).success).toBe(true);
  });

  it("requires a positive amount", () => {
    expect(transactionSchema.safeParse({ ...transfer, amount: 0 }).success).toBe(false);
  });
});
