import { describe, expect, it } from "vitest";
import { recurringSchema } from "@/lib/validations/recurring";

describe("recurringSchema", () => {
  it("normalizes empty optional IDs", () => {
    const result = recurringSchema.safeParse({
      type: "EXPENSE",
      amount: 100_000,
      accountId: "account-a",
      toAccountId: "",
      categoryId: "category-a",
      subCategoryId: "",
      frequency: "DAILY",
      interval: 1,
      startDate: new Date("2025-01-01T00:00:00.000Z"),
      endDate: null,
      note: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.toAccountId).toBeNull();
      expect(result.data.subCategoryId).toBeNull();
    }
  });
});
