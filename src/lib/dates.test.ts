import { describe, expect, it } from "vitest";
import { getPeriodRange } from "@/lib/dates";

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
});
