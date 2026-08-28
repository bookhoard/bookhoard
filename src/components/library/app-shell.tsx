"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { BookDetailDrawer } from "./book-detail-drawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />

        <div className="flex flex-1 overflow-hidden px-8 pb-8">
          <div className="flex-1 overflow-y-auto pr-1 pt-10">
            <div className="flex flex-col gap-8">{children}</div>
          </div>
        </div>
      </div>

      <BookDetailDrawer />
    </div>
  );
}
