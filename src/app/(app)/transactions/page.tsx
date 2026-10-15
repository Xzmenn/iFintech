import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function TransactionsPage() {
  return <><PageHeader title="Transaksi" description="Catat dan tinjau seluruh pemasukan serta pengeluaran." /><EmptyState title="Belum ada transaksi" description="Transaksi yang Anda catat akan muncul di sini." /></>;
}
