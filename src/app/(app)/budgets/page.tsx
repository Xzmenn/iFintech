import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function BudgetsPage() {
  return (
    <>
      <PageHeader
        title="Budget"
        description="Rencanakan pengeluaran bulanan dengan lebih terarah."
      />
      <EmptyState
        title="Belum ada budget"
        description="Buat budget untuk memantau batas pengeluaran Anda."
      />
    </>
  );
}
