import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama terlalu panjang"),
  email: z.string().trim().email("Alamat email tidak valid").max(254),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .max(72, "Kata sandi maksimal 72 karakter")
    .regex(/[A-Za-z]/, "Kata sandi harus mengandung huruf")
    .regex(/\d/, "Kata sandi harus mengandung angka"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Alamat email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Alamat email tidak valid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Tautan reset tidak valid"),
  password: registerSchema.shape.password,
});

export const profileSchema = z.object({
  name: registerSchema.shape.name,
  email: registerSchema.shape.email,
  image: z.string().url().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
  newPassword: registerSchema.shape.password,
});
