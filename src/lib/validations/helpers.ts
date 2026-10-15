import { z } from "zod";

export const optionalId = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().min(1).nullable().optional(),
);
