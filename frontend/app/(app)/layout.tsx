import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="container pb-20 pt-4">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}


