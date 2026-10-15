import { z } from "zod";

const accountFields = z.object({
  name: z.string().trim().min(1, "Nama akun wajib diisi").max(80),
  type: z.enum(["CASH", "BANK", "EWALLET", "CREDIT_CARD", "INVESTMENT"]),
  initialBalance: z.number().min(-1e13).max(1e13),
  creditLimit: z.number().positive().max(1e13).optional().nullable(),
  color: z
    .string()
    .regex(/^#[\da-f]{6}$/i)
    .optional(),
  icon: z.string().trim().min(1).max(64).optional(),
  note: z.string().trim().max(500).optional().nullable(),
});

function validateCreditLimit(
  value: { type?: string; creditLimit?: number | null },
  ctx: z.RefinementCtx,
) {
  if (value.type === "CREDIT_CARD" && !value.creditLimit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["creditLimit"],
      message: "Batas kredit wajib diisi untuk kartu kredit",
    });
  }
}

export const accountSchema = accountFields.superRefine(validateCreditLimit);
export const accountUpdateSchema = accountFields.partial().superRefine(validateCreditLimit);
export const accountArchiveSchema = z.object({ archived: z.boolean() });
