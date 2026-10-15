import { z } from "zod";

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);

const transactionFields = z.object({
  type: transactionTypeSchema,
  amount: z.number().positive("Jumlah harus lebih dari nol").max(1e13),
  date: z.coerce.date(),
  accountId: z.string().min(1, "Akun wajib dipilih"),
  toAccountId: z.string().min(1).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  subCategoryId: z.string().min(1).optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
});

function validateTransaction(
  value: {
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    accountId?: string;
    toAccountId?: string | null;
    categoryId?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (value.type === "TRANSFER") {
    if (!value.toAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toAccountId"],
        message: "Akun tujuan wajib dipilih untuk transfer",
      });
    } else if (value.toAccountId === value.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toAccountId"],
        message: "Akun tujuan harus berbeda dari akun asal",
      });
    }
  } else if ((value.type === "INCOME" || value.type === "EXPENSE") && !value.categoryId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["categoryId"],
      message: "Kategori wajib dipilih",
    });
  }
}

export const transactionSchema = transactionFields.superRefine(validateTransaction);
export const transactionUpdateSchema = transactionFields.partial();

export const transactionQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: transactionTypeSchema.optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  q: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(40).optional(),
  sort: z.enum(["date", "amount"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
