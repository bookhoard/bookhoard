"use client";

import * as React from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchDialog } from "./search-dialog";
import { cn } from "@/lib/utils";
import { useLibraryShell } from "./library-shell-context";
import { DEMO_MODE } from "@/lib/demo-mode";

export function AppHeader() {
  const { uploading, uploadFile } = useLibraryShell();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadFile(file);
  };

  return (
    <header className="flex h-20 shrink-0 items-center gap-2 px-4 md:gap-4 md:px-8">
      <SidebarTrigger className="shrink-0 rounded-full md:hidden" />

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-border bg-muted/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70 md:max-w-sm"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">Search your library…</span>
        <kbd className="hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium sm:block">
          ⌘K
        </kbd>
      </button>

      {!DEMO_MODE && (
        <div className="flex shrink-0 items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    aria-label="Add book"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <span className={cn(uploading && "animate-spin")}>
                      {uploading ? <Loader2 className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </Button>
                }
              />
              <TooltipContent>Add book</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
