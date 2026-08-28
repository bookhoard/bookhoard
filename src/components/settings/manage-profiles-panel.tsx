"use client";

import * as React from "react";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { EditProfileDrawer } from "./edit-profile-drawer";
import { type ProfileRole, type PublicProfile } from "@/lib/profiles/types";

interface ManageProfilesPanelProps {
  profiles: PublicProfile[];
  activeProfileId: string;
  onChanged: () => void;
}

export function ManageProfilesPanel({
  profiles,
  activeProfileId,
  onChanged,
}: ManageProfilesPanelProps) {
  const [editingProfile, setEditingProfile] = React.useState<PublicProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<PublicProfile | null>(null);
  const [creating, setCreating] = React.useState(false);

  const startEdit = (profile: PublicProfile) => {
    setEditingProfile(profile);
    setDrawerOpen(true);
  };

  const handleSave = async (
    id: string,
    patch: { name: string; color: string; role: ProfileRole }
  ) => {
    const res = await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.add({ title: "Couldn't save profile", description: data.error, type: "error" });
      return;
    }
    toast.add({ title: "Profile updated", type: "success" });
    onChanged();
  };

  const handleCreate = async (role: ProfileRole) => {
    setCreating(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Profile ${profiles.length + 1}`, role }),
      });
      if (res.ok) onChanged();
      else toast.add({ title: "Couldn't create profile", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (profile: PublicProfile) => {
    const res = await fetch(`/api/profiles/${profile.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.add({ title: "Couldn't delete profile", description: data.error, type: "error" });
      return;
    }
    toast.add({ title: "Profile deleted", type: "success" });
    onChanged();
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-base font-bold">Manage profiles</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Each profile keeps its own shelves, ratings, and reading progress. Admins can manage
            profiles and server-wide settings; readers can only edit their own profile.
          </p>
        </div>

        <div className="flex flex-col gap-2 p-5">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5"
            >
              <Avatar className="size-9 shrink-0">
                <AvatarFallback
                  className={cn(profile.color, "font-heading text-sm font-semibold text-white")}
                >
                  {profile.name.trim().charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile.name}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {profile.role}
                  {profile.id === activeProfileId ? " · You" : ""}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label={`${profile.name} options`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => startEdit(profile)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={profiles.length <= 1}
                    onClick={() => setConfirmDelete(profile)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" disabled={creating} className="gap-2">
                  <Plus className="size-4" />
                  Add profile
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreate("reader")}>
                Add as Reader
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreate("admin")}>
                Add as Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditProfileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        profile={editingProfile}
        isActive={editingProfile?.id === activeProfileId}
        onSave={handleSave}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the profile along with its shelves, ratings, and reading progress.
              Books in your library stay put.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirmDelete) handleDelete(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
