"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { useLibraryShell } from "./library-shell-context";
import { DEMO_MODE } from "@/lib/demo-mode";

/**
 * EPUB drag-and-drop upload, scoped to the Library page's own content area
 * (not the whole app shell) — dropping a file here shouldn't feel available
 * from the sidebar or from other pages. Exposes whether a file is currently
 * being dragged over so the caller can show a contextual placeholder (e.g. an
 * empty book-slot card in the grid) instead of a full-screen overlay.
 */
export function LibraryDropZone({
  children,
}: {
  children: (dragging: boolean) => React.ReactNode;
}) {
  const { uploadFile } = useLibraryShell();

  // dragenter/dragleave fire for every child element as the pointer crosses
  // them, so a plain boolean flickers — a counter only reaches zero once the
  // pointer has actually left the whole drop zone
  const dragCounter = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);

  if (DEMO_MODE) {
    return <div className="relative flex flex-col gap-8">{children(false)}</div>;
  }

  const handleDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dragCounter.current += 1;
    setDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.name.toLowerCase().endsWith(".epub")
    );
    for (const file of files) {
      void uploadFile(file);
    }
  };

  return (
    <div
      className="relative flex flex-col gap-8"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children(dragging)}
    </div>
  );
}

/** Empty, dashed book-slot shown in the grid while a file is being dragged over. */
export function UploadPlaceholderCard() {
  return (
    <div className="flex w-40 shrink-0 flex-col items-center gap-2 rounded-xl p-2 text-left">
      <div className="flex aspect-[2/3] w-full shrink-0 animate-pulse flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary bg-accent/20">
        <UploadCloud className="size-6 text-primary" strokeWidth={1.5} />
      </div>
      <p className="mt-1 line-clamp-1 text-sm font-semibold text-muted-foreground">Drop here</p>
      <p className="line-clamp-1 text-xs text-muted-foreground">EPUB file</p>
    </div>
  );
}
