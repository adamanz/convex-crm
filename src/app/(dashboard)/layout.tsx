"use client";

import { useState, useCallback } from "react";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/mobile/MobileNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { ShortcutProvider, ShortcutGuide } from "@/components/shortcuts";
import { CommandMenuProvider } from "@/components/layout/command-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock user for now - in production this would come from auth
  const user = {
    name: "Alex Johnson",
    email: "alex@company.com",
  };

  const handleMobileMenuOpen = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <ConvexClientProvider>
      <ShortcutProvider>
        <CommandMenuProvider>
          <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            {/* Desktop Sidebar */}
            <AppSidebar user={user} />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Mobile Header */}
              <MobileHeader onMenuClick={handleMobileMenuOpen} />

              {/* Page Content */}
              <main className="flex-1 overflow-hidden pb-20 lg:pb-0">
                {children}
              </main>

              {/* Mobile Bottom Navigation */}
              <MobileNav />
            </div>
          </div>

          {/* Global Keyboard Shortcut Guide Modal */}
          <ShortcutGuide />
        </CommandMenuProvider>
      </ShortcutProvider>
    </ConvexClientProvider>
  );
}
