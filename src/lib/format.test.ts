import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate } from "@/lib/format";

describe("format", () => {
  it("formats IDR amounts using Indonesian locale", () => {
    expect(formatCurrency(1500000).replace(/\s/g, " ")).toContain("Rp");
    expect(formatCurrency(1500000).replace(/\s/g, " ")).toContain("1.500.000");
  });

  it("formats dates using Indonesian month names", () => {
    expect(formatDate(new Date(2025, 0, 15))).toContain("Januari");
  });
});
