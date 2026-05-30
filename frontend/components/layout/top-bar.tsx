"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, MoreVertical } from "lucide-react";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { ThemeToggleSimple } from "@/components/ui/theme-toggle";

export function TopBar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      toast.success("تم تسجيل الخروج بنجاح");
      router.push("/login");
    } catch {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/90 backdrop-blur-sm">
      <div className="container max-w-6xl">
        <div className="flex h-14 items-center gap-3 md:gap-4">
          <Link href="/activities" className="shrink-0">
            <Logo size={36} showText={false} />
          </Link>

          <AppNav className="hidden md:flex flex-1 min-w-0 overflow-x-auto" />

          <div className="flex items-center gap-1 ms-auto shrink-0">
            <ThemeToggleSimple />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="قائمة الحساب"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>الحساب</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
