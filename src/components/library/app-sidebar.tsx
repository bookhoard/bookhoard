"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LibraryBig,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  TrendingUp,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOK_DRAG_MIME } from "@/lib/dnd";
import { toast } from "@/components/ui/toast";
import { ShelfFormDrawer } from "./shelf-form-drawer";
import { ProfileSwitcher } from "./profile-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { type Shelf } from "@/lib/shelves";
import { useLibraryShell } from "./library-shell-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const FOOTER_ITEMS = [
  { href: "/settings", label: "Settings", icon: Settings, external: false },
  { href: "https://docs.bookhoarder.dev", label: "Help", icon: HelpCircle, external: true },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const {
    books,
    shelves,
    smartShelves,
    createShelf,
    renameShelf,
    recolorShelf,
    deleteShelf,
    addBookToShelf,
    settings,
  } = useLibraryShell();

  const navItems: NavItem[] = [
    { href: "/", label: "Library", icon: LibraryBig },
    ...(settings.trendingEnabled
      ? [{ href: "/trending", label: "Trending", icon: TrendingUp }]
      : []),
  ];

  const [confirmDelete, setConfirmDelete] = React.useState<Shelf | null>(null);
  const [shelfDrawerOpen, setShelfDrawerOpen] = React.useState(false);
  const [editingShelf, setEditingShelf] = React.useState<Shelf | null>(null);
  const [dragOverShelfId, setDragOverShelfId] = React.useState<string | null>(null);

  // Navigating to a new page (e.g. tapping a nav item or shelf in the
  // mobile sheet) should collapse the sidebar instead of leaving it open
  // over the new page.
  React.useEffect(() => {
    setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader>
        <ProfileSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">Smart Shelves</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {smartShelves.map((shelf) => (
              <SidebarMenuItem key={shelf.id}>
                <SidebarMenuButton
                  isActive={pathname === `/shelf/${shelf.id}`}
                  tooltip={shelf.name}
                  render={<Link href={`/shelf/${shelf.id}`} />}
                >
                  <shelf.icon />
                  <span>{shelf.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">Shelves</SidebarGroupLabel>
          <SidebarGroupAction onClick={startCreate} title="New shelf" aria-label="New shelf">
            <Plus />
          </SidebarGroupAction>
          <SidebarMenu className="gap-1">
            {shelves.map((shelf) => {
              const active = pathname === `/shelf/${shelf.id}`;
              const letter = shelf.name.trim().charAt(0).toUpperCase() || "?";

              return (
                <SidebarMenuItem
                  key={shelf.id}
                  onDragOver={handleShelfDragOver}
                  onDragEnter={(e) => {
                    if (!e.dataTransfer.types.includes(BOOK_DRAG_MIME)) return;
                    setDragOverShelfId(shelf.id);
                  }}
                  onDragLeave={(e) => {
                    // dragleave fires when moving onto a child too — only
                    // clear the highlight once the pointer actually left
                    // the row, or it flickers.
                    if (!e.dataTransfer.types.includes(BOOK_DRAG_MIME)) return;
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverShelfId((prev) => (prev === shelf.id ? null : prev));
                  }}
                  onDrop={handleShelfDrop(shelf)}
                >
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={shelf.name}
                    render={<Link href={`/shelf/${shelf.id}`} />}
                    className={cn(
                      dragOverShelfId === shelf.id &&
                        "bg-sidebar-accent text-sidebar-accent-foreground ring-2 ring-sidebar-ring"
                    )}
                  >
                    <Avatar className="size-5">
                      <AvatarFallback className={cn(shelf.color, "text-[10px] font-semibold text-white")}>
                        {letter}
                      </AvatarFallback>
                    </Avatar>
                    <span>{shelf.name}</span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <SidebarMenuAction showOnHover aria-label={`${shelf.name} options`} />
                      }
                    >
                      <MoreVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right" className="w-36">
                      <DropdownMenuItem onClick={() => startEdit(shelf)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(shelf)}>
                        <Trash2 className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            })}

            {shelves.length === 0 && (
              <SidebarMenuItem>
                <span className="block px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No shelves yet.
                </span>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-1">
          {FOOTER_ITEMS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={!item.external && pathname === item.href}
                tooltip={item.label}
                render={
                  item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" />
                  ) : (
                    <Link href={item.href} />
                  )
                }
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

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
    </Sidebar>
  );
}
