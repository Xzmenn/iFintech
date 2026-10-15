import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Laporan" description="Pahami tren dan pola keuangan Anda." />
      <EmptyState
        title="Laporan belum tersedia"
        description="Laporan akan terbentuk setelah ada transaksi."
      />
    </>
  );
}
