import { describe, expect, it } from "vitest";
import { getBudgetStatus } from "@/lib/budget";

describe("getBudgetStatus", () => {
  it("reports remaining budget while under the warning threshold", () => {
    expect(getBudgetStatus(400, 1000, 80)).toEqual({
      percent: 40,
      remaining: 600,
      status: "aman",
    });
  });

  it("warns at the threshold and reports overspending", () => {
    expect(getBudgetStatus(800, 1000, 80).status).toBe("peringatan");
    expect(getBudgetStatus(1100, 1000, 80)).toEqual({
      percent: 110,
      remaining: -100,
      status: "melebihi",
    });
  });
});
