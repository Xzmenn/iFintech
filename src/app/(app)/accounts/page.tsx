import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function AccountsPage() {
  return <><PageHeader title="Akun" description="Kelola rekening, dompet, dan kartu Anda." /><EmptyState title="Belum ada akun" description="Tambahkan akun untuk mulai melacak saldo." /></>;
}
