"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { BookDetailDrawer } from "./book-detail-drawer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({
  children,
  defaultSidebarOpen,
}: {
  children: React.ReactNode;
  defaultSidebarOpen: boolean;
}) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar />

      <SidebarInset className="h-dvh overflow-hidden">
        <AppHeader />

        <div className="flex flex-1 overflow-hidden md:pb-8 md:pl-8">
          <div className="flex-1 overflow-y-auto px-4 pt-10 md:px-0">
            <div className="flex flex-col gap-8 md:pr-8">{children}</div>
          </div>
        </div>
      </SidebarInset>

      <BookDetailDrawer />
    </SidebarProvider>
  );
}
