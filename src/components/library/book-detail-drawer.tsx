"use client";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { DetailPanel } from "./detail-panel";
import { useLibraryShell } from "./library-shell-context";

export function BookDetailDrawer() {
  const { selected, displayedBook, setSelected, bookCardActions } = useLibraryShell();

  return (
    <Drawer
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) setSelected(null);
      }}
      modal={false}
      swipeDirection="right"
    >
      <DrawerContent className="my-3 border-t border-b">
        {displayedBook && (
          <DetailPanel book={displayedBook} onClose={() => setSelected(null)} {...bookCardActions} />
        )}
      </DrawerContent>
    </Drawer>
  );
}
