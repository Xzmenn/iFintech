import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  year: z.coerce.number().int().min(1900).max(9999),
  month: z.coerce.number().int().min(1).max(12),
  amount: z.coerce.number().positive("Anggaran harus lebih dari nol").max(1e13),
  alertThreshold: z.coerce.number().int().min(1).max(100).default(80),
  note: z.string().max(500).optional().nullable(),
});

export const budgetUpdateSchema = budgetSchema.partial();
