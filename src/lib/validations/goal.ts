import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().trim().min(1).max(100),
  targetAmount: z.coerce.number().positive("Target harus lebih dari nol").max(1e13),
  deadline: z.coerce.date().optional().nullable(),
  accountId: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#22c55e"),
  icon: z.string().min(1).max(40).default("target"),
  note: z.string().max(1000).optional().nullable(),
});

export const goalUpdateSchema = goalSchema.partial();

export const goalContributionSchema = z.object({
  type: z.enum(["SETORAN", "PENARIKAN"]),
  amount: z.coerce.number().positive("Jumlah harus lebih dari nol").max(1e13),
  date: z.coerce.date(),
  note: z.string().max(500).optional().nullable(),
});
