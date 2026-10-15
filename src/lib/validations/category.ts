import { z } from "zod";

export const categoryTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);

const categoryFields = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(80),
  type: categoryTypeSchema,
  icon: z.string().trim().min(1).max(64),
  color: z.string().regex(/^#[\da-f]{6}$/i),
});

export const categorySchema = categoryFields;
export const categoryUpdateSchema = categoryFields.partial();

export const subCategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1, "Nama subkategori wajib diisi").max(80),
});

export const subCategoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nama subkategori wajib diisi").max(80),
});
