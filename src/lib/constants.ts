export const ACCOUNT_TYPE_LABELS = {
  CASH: "Kas",
  BANK: "Bank",
  EWALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
  INVESTMENT: "Investasi",
} as const;

export const DEFAULT_CATEGORIES = [
  {
    name: "Makan & Minum",
    type: "EXPENSE",
    icon: "utensils",
    color: "#f97316",
    subCategories: ["Restoran", "Kopi", "Groceries"],
  },
  {
    name: "Transportasi",
    type: "EXPENSE",
    icon: "bus",
    color: "#3b82f6",
    subCategories: ["Bensin", "Ojek Online", "Parkir", "Tol"],
  },
  {
    name: "Belanja",
    type: "EXPENSE",
    icon: "shopping-bag",
    color: "#a855f7",
    subCategories: ["Pakaian", "Elektronik"],
  },
  {
    name: "Tagihan",
    type: "EXPENSE",
    icon: "receipt",
    color: "#eab308",
    subCategories: ["Listrik", "Air", "Internet", "Pulsa"],
  },
  {
    name: "Hiburan",
    type: "EXPENSE",
    icon: "clapperboard",
    color: "#ec4899",
    subCategories: ["Film", "Langganan"],
  },
  { name: "Kesehatan", type: "EXPENSE", icon: "heart-pulse", color: "#ef4444" },
  { name: "Pendidikan", type: "EXPENSE", icon: "graduation-cap", color: "#14b8a6" },
  { name: "Rumah Tangga", type: "EXPENSE", icon: "house", color: "#84cc16" },
  { name: "Sosial & Donasi", type: "EXPENSE", icon: "hand-heart", color: "#f43f5e" },
  { name: "Lainnya", type: "EXPENSE", icon: "circle-ellipsis", color: "#64748b" },
  { name: "Gaji", type: "INCOME", icon: "briefcase-business", color: "#22c55e" },
  { name: "Bonus", type: "INCOME", icon: "badge-percent", color: "#10b981" },
  { name: "Freelance", type: "INCOME", icon: "laptop", color: "#06b6d4" },
  { name: "Investasi", type: "INCOME", icon: "chart-no-axes-combined", color: "#0ea5e9" },
  { name: "Hadiah", type: "INCOME", icon: "gift", color: "#d946ef" },
  { name: "Lainnya", type: "INCOME", icon: "circle-ellipsis", color: "#64748b" },
  { name: "Transfer", type: "TRANSFER", icon: "arrow-left-right", color: "#6366f1" },
] as const;

export const PERIOD_PRESETS = [
  { value: "today", label: "Hari ini" },
  { value: "week", label: "Minggu ini" },
  { value: "month", label: "Bulan ini" },
  { value: "year", label: "Tahun ini" },
  { value: "custom", label: "Rentang khusus" },
] as const;
