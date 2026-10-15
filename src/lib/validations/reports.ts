import { z } from "zod";

export const reportDateRangeSchema = z.object({
  from: z.string().min(1).pipe(z.coerce.date()),
  to: z.string().min(1).pipe(z.coerce.date()),
});

export const reportsPeriodSchema = reportDateRangeSchema.refine(
  (period) => period.from <= period.to,
  {
    message: "Periode tidak valid",
    path: ["to"],
  },
);

export const netWorthQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(60).default(12),
});
