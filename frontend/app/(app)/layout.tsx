import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell min-h-screen flex flex-col">
      <TopBar />
      <main className="container max-w-6xl flex-1 pb-20 pt-5 md:pb-6 md:pt-6">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
