import type { LucideIcon } from "lucide-react";
import {
  Home,
  FileText,
  Settings,
  Users,
  GraduationCap,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  requiresSuperAdmin?: boolean;
}

export const mainNavigation: NavItem[] = [
  { name: "الأنشطة", href: "/activities", icon: Home },
  { name: "الطلاب", href: "/students", icon: GraduationCap },
  { name: "التقارير", href: "/reports", icon: FileText },
  { name: "الإدارة", href: "/admin", icon: Users, requiresSuperAdmin: true },
  { name: "الإعدادات", href: "/settings", icon: Settings },
];
