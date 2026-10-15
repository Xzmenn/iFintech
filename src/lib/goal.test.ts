import { describe, expect, it } from "vitest";
import { estimateGoalCompletion } from "@/lib/goal";

const now = new Date("2026-10-15T12:00:00.000Z");

describe("estimateGoalCompletion", () => {
  it("estimates an on-track goal from recent contributions", () => {
    const result = estimateGoalCompletion(
      300,
      1000,
      [
        { amount: 100, date: "2026-08-15T12:00:00.000Z" },
        { amount: 100, date: "2026-09-15T12:00:00.000Z" },
        { amount: 100, date: "2026-10-10T12:00:00.000Z" },
      ],
      "2027-10-15T12:00:00.000Z",
      now,
    );
    expect(result.percent).toBe(30);
    expect(result.estimatedDate).toBeInstanceOf(Date);
    expect(result.onTrack).toBe(true);
  });

  it("marks a goal behind schedule when the monthly average is insufficient", () => {
    const result = estimateGoalCompletion(
      100,
      1000,
      [{ amount: 10, date: "2026-10-10T12:00:00.000Z" }],
      "2026-11-15T12:00:00.000Z",
      now,
    );
    expect(result.onTrack).toBe(false);
    expect(result.requiredPerMonth).toBeGreaterThan(result.monthlyAverage);
  });

  it("does not estimate completion without contributions", () => {
    const result = estimateGoalCompletion(0, 1000, [], "2027-10-15T12:00:00.000Z", now);
    expect(result.estimatedDate).toBeNull();
  });

  it("recognizes goals that are already complete", () => {
    const result = estimateGoalCompletion(1000, 1000, [], null, now);
    expect(result.percent).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.estimatedDate).toEqual(now);
    expect(result.onTrack).toBe(true);
  });
});
