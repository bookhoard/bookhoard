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
  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <AppSidebar initialCollapsed={initialSidebarCollapsed} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />

        <div className="flex flex-1 overflow-hidden pb-8 pl-8">
          <div className="flex-1 overflow-y-auto pt-10">
            <div className="flex flex-col gap-8 pr-8">{children}</div>
          </div>
        </div>
      </div>

      <BookDetailDrawer />
    </div>
  );
}
