"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { BookDetailDrawer } from "./book-detail-drawer";

export function AppShell({
  children,
  initialSidebarCollapsed,
}: {
  children: React.ReactNode;
  initialSidebarCollapsed: boolean;
}) {
  // Sidebar collapse (desktop, persisted) and mobile open/closed (session-only,
  // always starts closed) are separate concerns — a phone shouldn't remember
  // "open" across visits the way a desktop remembers "collapsed".
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <AppSidebar
        initialCollapsed={initialSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader onOpenMobileMenu={() => setMobileSidebarOpen(true)} />

        <div className="flex flex-1 overflow-hidden pb-8 md:pl-8">
          <div className="flex-1 overflow-y-auto px-4 pt-10 md:px-0">
            <div className="flex flex-col gap-8 md:pr-8">{children}</div>
          </div>
        </div>
      </div>

      <BookDetailDrawer />
    </div>
  );
}
