import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function CategoriesPage() {
  return <><PageHeader title="Kategori" description="Atur kategori pemasukan dan pengeluaran." /><EmptyState title="Kategori Anda akan tampil di sini" description="Kategori bawaan tersedia setelah akun terdaftar." /></>;
}
