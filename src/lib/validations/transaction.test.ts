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
    expect(transactionSchema.safeParse({ ...transfer, toAccountId: undefined }).success).toBe(
      false,
    );
    expect(transactionSchema.safeParse({ ...transfer, toAccountId: "account-a" }).success).toBe(
      false,
    );
    expect(transactionSchema.safeParse(transfer).success).toBe(true);
  });

  it("normalizes empty optional IDs for expenses", () => {
    const result = transactionSchema.safeParse({
      ...transfer,
      type: "EXPENSE",
      toAccountId: "",
      categoryId: "category-a",
      subCategoryId: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.toAccountId).toBeNull();
      expect(result.data.subCategoryId).toBeNull();
    }
  });

  it("requires a destination account when an empty ID is submitted for a transfer", () => {
    const result = transactionSchema.safeParse({ ...transfer, toAccountId: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.find((issue) => issue.path[0] === "toAccountId")?.message).toBe(
        "Akun tujuan wajib dipilih untuk transfer",
      );
    }
  });

  it("requires a category when an empty ID is submitted for income", () => {
    const result = transactionSchema.safeParse({
      ...transfer,
      type: "INCOME",
      toAccountId: "",
      categoryId: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.find((issue) => issue.path[0] === "categoryId")?.message).toBe(
        "Kategori wajib dipilih",
      );
    }
  });

  it("requires a positive amount", () => {
    expect(transactionSchema.safeParse({ ...transfer, amount: 0 }).success).toBe(false);
  });
});
