import {
  ArrowLeftRight,
  BadgePercent,
  Banknote,
  BriefcaseBusiness,
  Bus,
  ChartNoAxesCombined,
  ChartPie,
  CircleEllipsis,
  CircleHelp,
  Clapperboard,
  Coffee,
  Gift,
  HandHeart,
  HeartPulse,
  House,
  Laptop,
  Plane,
  Receipt,
  ShoppingBag,
  Tag,
  Utensils,
  Wallet,
  GraduationCap,
} from "lucide-react";

export const CATEGORY_ICONS = {
  wallet: Wallet,
  utensils: Utensils,
  coffee: Coffee,
  bus: Bus,
  "shopping-bag": ShoppingBag,
  receipt: Receipt,
  "heart-pulse": HeartPulse,
  house: House,
  "chart-pie": ChartPie,
  "briefcase-business": BriefcaseBusiness,
  laptop: Laptop,
  gift: Gift,
  plane: Plane,
  banknote: Banknote,
  clapperboard: Clapperboard,
  tag: Tag,
  "graduation-cap": GraduationCap,
  "hand-heart": HandHeart,
  "circle-ellipsis": CircleEllipsis,
  "badge-percent": BadgePercent,
  "chart-no-axes-combined": ChartNoAxesCombined,
  "arrow-left-right": ArrowLeftRight,
} as const;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

export function getCategoryIcon(name?: string) {
  return CATEGORY_ICONS[name as CategoryIconName] || CircleHelp;
}
