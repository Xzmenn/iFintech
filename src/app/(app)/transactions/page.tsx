import { Suspense } from "react";
import { TransactionManager } from "@/components/finance/transaction-manager";
import { LoadingState } from "@/components/shared/loading-state";

export default function TransactionsPage() {
  return <Suspense fallback={<LoadingState />}><TransactionManager /></Suspense>;
}
