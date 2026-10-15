import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Ringkasan kondisi keuangan Anda." />
      <EmptyState title="Siapkan ringkasan keuangan Anda" description="Data transaksi, saldo, dan target akan tampil di sini setelah Anda mulai mencatat." />
    </>
  );
}
