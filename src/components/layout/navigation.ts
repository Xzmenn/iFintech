import {
  BarChart3,
  CircleDollarSign,
  LayoutDashboard,
  Repeat2,
  Settings2,
  Tags,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const navigationItems: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: Repeat2 },
  { href: "/accounts", label: "Akun", icon: Wallet },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/budgets", label: "Budget", icon: CircleDollarSign },
  { href: "/goals", label: "Target", icon: Target },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/settings", label: "Pengaturan", icon: Settings2 },
];
