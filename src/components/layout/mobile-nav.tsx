"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, WalletCards } from "lucide-react";
import { navigationItems } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const primaryItems = navigationItems.slice(0, 4);

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start justify-around border-t px-2 pt-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {primaryItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="text-muted-foreground h-auto min-w-14 flex-col gap-1 px-2 py-1.5 text-[10px]"
          >
            <MoreHorizontal className="size-5" />
            Lainnya
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <WalletCards className="text-primary size-5" /> Menu iFintech
            </SheetTitle>
          </SheetHeader>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {navigationItems.slice(4).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="hover:bg-muted flex items-center gap-3 rounded-xl border p-4 text-sm font-medium"
              >
                <Icon className="text-primary size-4" /> {label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
