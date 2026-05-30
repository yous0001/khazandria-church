"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { mainNavigation, type NavItem } from "@/lib/navigation";
import type { User } from "@/types/domain";

export function useNavItems(): NavItem[] {
  const { data: currentUser } = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: () => api.users.getCurrent(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return mainNavigation.filter((item) => {
    if (item.requiresSuperAdmin) {
      return currentUser?.role === "superadmin";
    }
    return true;
  });
}
