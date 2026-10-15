import { z } from "zod";
import { optionalId } from "@/lib/validations/helpers";
import { transactionTypeSchema } from "@/lib/validations/transaction";

const recurringFields = z.object({
  type: transactionTypeSchema,
  amount: z.number().positive("Jumlah harus lebih dari nol").max(1e13),
  accountId: z.string().min(1),
  toAccountId: optionalId,
  categoryId: optionalId,
  subCategoryId: optionalId,
  note: z.string().trim().max(1000).optional().nullable(),
  tagNames: z.string().trim().max(500).optional().nullable(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  interval: z.number().int().min(1).max(365),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const recurringSchema = recurringFields.superRefine((value, ctx) => {
  if (value.type === "TRANSFER" && (!value.toAccountId || value.toAccountId === value.accountId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["toAccountId"],
      message: "Pilih akun tujuan transfer yang berbeda",
    });
  }
  if (value.type !== "TRANSFER" && !value.categoryId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["categoryId"],
      message: "Kategori wajib dipilih",
    });
  }
  if (value.endDate && value.endDate < value.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "Tanggal akhir harus setelah tanggal mulai",
    });
  }
});

export const recurringUpdateSchema = recurringFields.partial();
