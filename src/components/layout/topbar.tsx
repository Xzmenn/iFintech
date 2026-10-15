import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar() {
  return (
    <>
      <header className="bg-background/90 sticky top-0 z-20 flex h-16 items-center justify-between border-b px-4 backdrop-blur sm:px-8">
        <div className="lg:hidden">
          <span className="font-bold tracking-tight">iFintech</span>
        </div>
        <div className="text-muted-foreground hidden text-sm lg:block">
          Keuangan Anda, lebih terarah.
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <MobileNav />
    </>
  );
}
