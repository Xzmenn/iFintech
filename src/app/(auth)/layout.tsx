import Link from "next/link";
import { WalletCards } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-muted/40 relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-primary/10 pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -right-28 -bottom-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link href="/login" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="bg-primary text-primary-foreground shadow-primary/20 flex size-10 items-center justify-center rounded-xl shadow-lg">
            <WalletCards className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">iFintech</span>
        </Link>
        {children}
        <p className="text-muted-foreground mt-8 text-center text-xs">
          Keuangan lebih teratur, hidup lebih tenang.
        </p>
      </div>
    </main>
  );
}
