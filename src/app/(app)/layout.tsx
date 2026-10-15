import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] px-4 py-6 pb-28 sm:px-8 sm:py-8 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
