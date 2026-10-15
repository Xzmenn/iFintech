import { describe, expect, it } from "vitest";
import { normalizeMoney, parseMoney, toNumber } from "@/lib/money";

describe("money helpers", () => {
  it("parses and normalizes Rupiah amounts", () => {
    expect(parseMoney("Rp 1.234.500")).toBe(1234500);
    expect(normalizeMoney("-500")).toBe(0);
  });

  it("converts decimal-like values", () => {
    expect(toNumber({ toNumber: () => 1200 })).toBe(1200);
    expect(toNumber(null)).toBe(0);
  });
});
