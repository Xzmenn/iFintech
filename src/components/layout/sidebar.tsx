"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/components/layout/navigation";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-card fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
      <Link href="/dashboard" className="flex h-20 items-center gap-3 px-7">
        <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
          <WalletCards className="size-5" />
        </span>
        <span className="text-xl font-bold tracking-tight">iFintech</span>
      </Link>
      <p className="text-muted-foreground px-7 pt-5 pb-3 text-[11px] font-semibold tracking-[0.15em] uppercase">
        Menu utama
      </p>
      <nav className="flex-1 space-y-1 px-3">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="bg-muted/40 m-4 rounded-2xl border p-4">
        <p className="text-sm font-semibold">Kelola dengan bijak</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Pantau arus uang dan capai target finansial Anda.
        </p>
      </div>
    </aside>
  );
}
