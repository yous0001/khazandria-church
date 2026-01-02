"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Home, FileText, Settings, Users, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import type { User } from "@/types/domain";

const navigation = [
  { name: "الأنشطة", href: "/activities", icon: Home },
  { name: "الطلاب", href: "/students", icon: GraduationCap },
  { name: "التقارير", href: "/reports", icon: FileText },
  { name: "الإدارة", href: "/admin", icon: Users, requiresSuperAdmin: true },
  { name: "الإعدادات", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  // Get current user to check role
  const { data: currentUser } = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: () => api.users.getCurrent(),
  });

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (item.requiresSuperAdmin) {
      return currentUser?.role === "superadmin";
    }
    return true;
  });

  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {filteredNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

