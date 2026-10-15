"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginValues = z.infer<typeof loginSchema>;
const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama",
    path: ["confirmPassword"],
  });
type RegisterValues = z.infer<typeof registerFormSchema>;
type ForgotValues = z.infer<typeof forgotPasswordSchema>;
type ResetValues = z.infer<typeof resetPasswordSchema>;

function FormField({
  label,
  id,
  error,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <Button className="w-full" type="submit" disabled={loading}>
      {loading && <LoaderCircle className="mr-2 size-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const onSubmit = form.handleSubmit(async (values) => {
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (result?.error) {
      form.setError("root", { message: "Email atau kata sandi tidak sesuai." });
      return;
    }
    toast.success("Berhasil masuk");
    router.push("/dashboard");
    router.refresh();
  });
  return (
    <Card className="border-border/70 shadow-xl shadow-black/[0.04]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Selamat datang kembali</CardTitle>
        <CardDescription>Masuk untuk melihat kondisi keuangan Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            {...form.register("email")}
            error={form.formState.errors.email?.message}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata sandi</Label>
              <Link
                className="text-primary text-xs font-medium hover:underline"
                href="/forgot-password"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
            )}
          </div>
          {form.formState.errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
          <SubmitButton loading={form.formState.isSubmitting}>Masuk</SubmitButton>
        </form>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerFormSchema) });
  const onSubmit = form.handleSubmit(async (formValues) => {
    const values = {
      name: formValues.name,
      email: formValues.email,
      password: formValues.password,
    };
    try {
      await apiClient("/api/auth/register", { method: "POST", body: JSON.stringify(values) });
      const result = await signIn("credentials", { ...values, redirect: false });
      if (result?.error) {
        toast.success("Akun berhasil dibuat. Silakan masuk.");
        router.push("/login");
        return;
      }
      toast.success("Akun berhasil dibuat");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Pendaftaran gagal",
      });
    }
  });
  return (
    <Card className="border-border/70 shadow-xl shadow-black/[0.04]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Buat akun iFintech</CardTitle>
        <CardDescription>Mulai kelola keuangan dengan lebih terarah.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField
            id="name"
            label="Nama lengkap"
            autoComplete="name"
            placeholder="Nama Anda"
            {...form.register("name")}
            error={form.formState.errors.name?.message}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            {...form.register("email")}
            error={form.formState.errors.email?.message}
          />
          <FormField
            id="password"
            label="Kata sandi"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
          <FormField
            id="confirmPassword"
            label="Ulangi kata sandi"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
            error={form.formState.errors.confirmPassword?.message}
          />
          {form.formState.errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
          <SubmitButton loading={form.formState.isSubmitting}>Buat akun</SubmitButton>
        </form>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function ForgotPasswordForm() {
  const form = useForm<ForgotValues>({ resolver: zodResolver(forgotPasswordSchema) });
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await apiClient("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      form.setError("root", {
        message: "Jika email terdaftar, tautan pemulihan akan segera dikirim.",
      });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Permintaan gagal",
      });
    }
  });
  return (
    <Card className="border-border/70 shadow-xl shadow-black/[0.04]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Lupa kata sandi?</CardTitle>
        <CardDescription>Masukkan email dan kami akan mengirim tautan pemulihan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            {...form.register("email")}
            error={form.formState.errors.email?.message}
          />
          {form.formState.errors.root && (
            <p role="status" className="text-sm text-emerald-700">
              {form.formState.errors.root.message}
            </p>
          )}
          <SubmitButton loading={form.formState.isSubmitting}>Kirim tautan pemulihan</SubmitButton>
        </form>
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground mt-6 flex items-center justify-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> Kembali ke masuk
        </Link>
      </CardContent>
    </Card>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await apiClient("/api/auth/reset-password", { method: "POST", body: JSON.stringify(values) });
      toast.success("Kata sandi berhasil diperbarui");
      router.push("/login");
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Tautan reset tidak valid",
      });
    }
  });
  return (
    <Card className="border-border/70 shadow-xl shadow-black/[0.04]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Atur kata sandi baru</CardTitle>
        <CardDescription>Gunakan kata sandi yang kuat dan mudah Anda ingat.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <FormField
            id="password"
            label="Kata sandi baru"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
          {form.formState.errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
          <SubmitButton loading={form.formState.isSubmitting}>Simpan kata sandi</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
