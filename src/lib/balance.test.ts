import { describe, expect, it } from "vitest";
import { transactionEffects } from "@/lib/balance";

describe("transactionEffects", () => {
  it("adds income to the selected account", () => {
    expect(transactionEffects({ type: "INCOME", amount: 100, accountId: "a" })).toEqual([
      { accountId: "a", delta: 100 },
    ]);
  });

  it("subtracts expenses from the selected account", () => {
    expect(transactionEffects({ type: "EXPENSE", amount: 40, accountId: "a" })).toEqual([
      { accountId: "a", delta: -40 },
    ]);
  });

  it("moves transfer amounts between accounts", () => {
    expect(
      transactionEffects({ type: "TRANSFER", amount: 75, accountId: "a", toAccountId: "b" }),
    ).toEqual([
      { accountId: "a", delta: -75 },
      { accountId: "b", delta: 75 },
    ]);
  });
});
