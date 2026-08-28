"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenText,
  ChevronLeft,
  LibraryBig,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOK_DRAG_MIME } from "@/lib/dnd";
import { toast } from "@/components/ui/toast";
import { ShelfFormDrawer } from "./shelf-form-drawer";
import { ProfileMenu } from "./profile-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Shelf } from "@/lib/shelves";
import { useLibraryShell } from "./library-shell-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    books,
    shelves,
    createShelf,
    renameShelf,
    recolorShelf,
    deleteShelf,
    addBookToShelf,
    settings,
  } = useLibraryShell();

  const navItems: NavItem[] = [
    { href: "/", label: "Library", icon: LibraryBig },
    { href: "/reading-now", label: "Reading Now", icon: BookOpenText },
    ...(settings.trendingEnabled
      ? [{ href: "/trending", label: "Trending", icon: TrendingUp }]
      : []),
  ];

  const [collapsed, setCollapsed] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<Shelf | null>(null);
  const [shelfDrawerOpen, setShelfDrawerOpen] = React.useState(false);
  const [editingShelf, setEditingShelf] = React.useState<Shelf | null>(null);
  const [dragOverShelfId, setDragOverShelfId] = React.useState<string | null>(null);

  const handleShelfDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(BOOK_DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleShelfDrop = (shelf: Shelf) => (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(BOOK_DRAG_MIME)) return;
    e.preventDefault();
    setDragOverShelfId(null);
    const bookId = e.dataTransfer.getData(BOOK_DRAG_MIME);
    if (!bookId) return;
    const book = books.find((b) => b.id === bookId);
    if (shelf.bookIds.includes(bookId)) {
      toast.add({
        title: "Already on shelf",
        description: book ? `"${book.title}" is already on ${shelf.name}` : undefined,
        type: "info",
      });
      return;
    }
    addBookToShelf(shelf.id, bookId);
    toast.add({
      title: "Added to shelf",
      description: book ? `"${book.title}" was added to ${shelf.name}` : undefined,
      type: "success",
    });
  };

  const startCreate = () => {
    setEditingShelf(null);
    setShelfDrawerOpen(true);
  };

  const startEdit = (shelf: Shelf) => {
    setEditingShelf(shelf);
    setShelfDrawerOpen(true);
  };

  const handleShelfEdited = (id: string, name: string, color: string) => {
    renameShelf(id, name);
    recolorShelf(id, color);
  };

  const handleDeleteShelf = (id: string) => {
    deleteShelf(id);
    if (pathname === `/shelf/${id}`) router.push("/");
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-6 -right-3 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
      >
        <ChevronLeft
          className={cn("size-3.5 transition-transform", collapsed && "rotate-180")}
        />
      </button>

      <div className="flex h-20 items-center gap-2.5 px-5">
        <div className="group relative size-9 shrink-0 overflow-hidden">
          <Image
            src="/logo/body.png"
            alt=""
            width={36}
            height={36}
            className="absolute inset-0 size-full object-contain"
          />
          <Image
            src="/logo/book.png"
            alt="Bookhoarder"
            width={36}
            height={36}
            className="absolute inset-0 size-full translate-y-[17%] object-contain transition-transform duration-300 ease-out group-hover:-translate-y-[1%]"
          />
        </div>
        {!collapsed && (
          <span className="font-heading text-lg font-bold tracking-tight">
            Bookhoarder
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1 px-3 pt-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="size-[18px] shrink-0" strokeWidth={2} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 flex flex-col gap-1 px-3">
        <div className="flex items-center justify-between px-3 pb-2">
          {!collapsed && (
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">
              SHELVES
            </p>
          )}
          <button
            type="button"
            onClick={startCreate}
            aria-label="New shelf"
            className={cn(
              "flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
              collapsed && "mx-auto"
            )}
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {shelves.map((shelf) => {
          const active = pathname === `/shelf/${shelf.id}`;

          return (
            <div
              key={shelf.id}
              onDragOver={handleShelfDragOver}
              onDragEnter={(e) => {
                if (!e.dataTransfer.types.includes(BOOK_DRAG_MIME)) return;
                setDragOverShelfId(shelf.id);
              }}
              onDragLeave={(e) => {
                if (!e.dataTransfer.types.includes(BOOK_DRAG_MIME)) return;
                setDragOverShelfId((prev) => (prev === shelf.id ? null : prev));
              }}
              onDrop={handleShelfDrop(shelf)}
              className={cn(
                "group flex items-center gap-2 rounded-lg pr-2 text-sm transition-colors",
                dragOverShelfId === shelf.id
                  ? "bg-accent text-accent-foreground ring-2 ring-ring"
                  : active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Link
                href={`/shelf/${shelf.id}`}
                className={cn(
                  "flex flex-1 items-center gap-3 overflow-hidden px-3 py-2 text-left",
                  collapsed && "justify-center px-0"
                )}
              >
                <span className={cn("size-2 shrink-0 rounded-full", shelf.color)} />
                {!collapsed && <span className="truncate">{shelf.name}</span>}
              </Link>
              {!collapsed && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label={`${shelf.name} options`}
                        className="flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100 aria-expanded:opacity-100"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => startEdit(shelf)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setConfirmDelete(shelf)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}

        {shelves.length === 0 && !collapsed && (
          <p className="px-3 text-xs text-muted-foreground">No shelves yet.</p>
        )}
      </div>

      <div className="mt-auto border-t border-border p-3">
        <ProfileMenu collapsed={collapsed} />
      </div>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the shelf. Books on it stay in your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirmDelete) handleDeleteShelf(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShelfFormDrawer
        open={shelfDrawerOpen}
        onOpenChange={setShelfDrawerOpen}
        existingCount={shelves.length}
        editingShelf={editingShelf}
        onCreate={createShelf}
        onEdit={handleShelfEdited}
      />
    </aside>
  );
}
