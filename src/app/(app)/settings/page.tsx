import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function SettingsPage() {
  return <><PageHeader title="Pengaturan" description="Sesuaikan profil dan preferensi iFintech." /><EmptyState title="Pengaturan akun" description="Preferensi profil, mata uang, dan keamanan akun akan tersedia di sini." /></>;
}
