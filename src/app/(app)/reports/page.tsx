import { Suspense } from "react";
import { ReportsView } from "@/components/finance/reports-view";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Laporan" description="Pahami tren dan pola keuangan Anda." />
          <LoadingState rows={4} />
        </>
      }
    >
      <ReportsView />
    </Suspense>
  );
}
