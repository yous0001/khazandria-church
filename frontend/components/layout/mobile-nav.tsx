"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNavItems } from "@/hooks/use-nav-items";

export function MobileNav() {
  const pathname = usePathname();
  const items = useNavItems();

  return (
    <nav
      className="mobile-nav fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden"
      aria-label="التنقل السفلي"
    >
      <div className="flex items-stretch justify-around h-16 max-w-5xl mx-auto px-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
