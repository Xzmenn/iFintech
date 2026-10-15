import { z } from "zod";

const settingsFields = z.object({
  currency: z.enum(["IDR", "USD", "SGD", "EUR", "MYR"]),
  locale: z.enum(["id-ID", "en-US"]),
  theme: z.enum(["light", "dark", "system"]),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  budgetAlertThreshold: z.number().int().min(1).max(100),
});

export const settingsSchema = settingsFields;
export const settingsUpdateSchema = settingsFields
  .partial()
  .refine((settings) => Object.keys(settings).length > 0, {
    message: "Pilih preferensi yang ingin diubah",
  });
