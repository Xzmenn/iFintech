import Link from "next/link";
import { WalletCards } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/40 px-4 py-12">
      <div className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-28 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link href="/login" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <WalletCards className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">iFintech</span>
        </Link>
        {children}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Keuangan lebih teratur, hidup lebih tenang.
        </p>
      </div>
    </main>
  );
}
