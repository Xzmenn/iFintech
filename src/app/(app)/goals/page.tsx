import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function GoalsPage() {
  return (
    <>
      <PageHeader
        title="Target"
        description="Wujudkan rencana finansial Anda satu langkah demi satu."
      />
      <EmptyState
        title="Belum ada target"
        description="Tambahkan target tabungan untuk menjaga motivasi."
      />
    </>
  );
}
