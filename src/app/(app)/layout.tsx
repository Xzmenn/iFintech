import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import Link from "next/link";
import { Plus } from "lucide-react";
import { RecurringRunner } from "@/components/layout/recurring-runner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/20 min-h-screen">
      <RecurringRunner />
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] px-4 py-6 pb-28 sm:px-8 sm:py-8 lg:pb-10">
          {children}
        </main>
      </div>
      <Link
        href="/transactions?new=1"
        aria-label="Tambah transaksi"
        className="bg-primary text-primary-foreground fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full shadow-lg lg:bottom-8"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
