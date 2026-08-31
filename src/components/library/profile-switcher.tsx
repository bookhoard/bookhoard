"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Lock, Loader2, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useLibraryShell } from "./library-shell-context";
import type { PublicProfile } from "@/lib/profiles/types";

export function ProfileSwitcher() {
  const router = useRouter();
  const { profiles, activeProfileId, activeProfile } = useLibraryShell();
  const isAdmin = activeProfile.role === "admin";
  const [switching, setSwitching] = React.useState(false);
  const [creatingProfile, setCreatingProfile] = React.useState(false);
  const [unlockProfile, setUnlockProfile] = React.useState<PublicProfile | null>(null);
  const [unlockPassword, setUnlockPassword] = React.useState("");
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  const performSwitch = async (profileId: string, password?: string) => {
    const res = await fetch("/api/profiles/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profileId, password }),
    });
    return res;
  };

  const switchTo = async (profile: PublicProfile) => {
    if (profile.id === activeProfileId || switching) return;
    if (profile.hasPassword) {
      setUnlockProfile(profile);
      setUnlockPassword("");
      setUnlockError(null);
      return;
    }
    setSwitching(true);
    await performSwitch(profile.id);
    router.refresh();
    setSwitching(false);
  };

  const submitUnlock = async () => {
    if (!unlockProfile) return;
    setSwitching(true);
    setUnlockError(null);
    const res = await performSwitch(unlockProfile.id, unlockPassword);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setUnlockError(data.error ?? "Incorrect password");
      setSwitching(false);
      return;
    }
    setSwitching(false);
    setUnlockProfile(null);
    router.refresh();
  };

  const addProfile = async () => {
    if (creatingProfile) return;
    setCreatingProfile(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Profile ${profiles.length + 1}`, role: "reader" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.add({ title: "Couldn't create profile", description: data.error, type: "error" });
        return;
      }
      toast.add({ title: "Profile added", description: `"${data.profile.name}" was created`, type: "success" });
      router.refresh();
    } finally {
      setCreatingProfile(false);
    }
  };

  // ⌘1 / ⌘2 / … jumps straight to the Nth profile in the list, from
  // anywhere in the app.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const index = Number(e.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= Math.min(profiles.length, 9)) return;
      e.preventDefault();
      switchTo(profiles[index]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton size="lg" className="aria-expanded:bg-sidebar-accent" />
              }
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback
                  className={cn(
                    activeProfile.color,
                    "rounded-lg font-heading text-sm font-semibold text-white"
                  )}
                >
                  {activeProfile.name.trim().charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">{activeProfile.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70 capitalize">
                  {activeProfile.role}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto text-sidebar-foreground/50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-lg" align="start" side="bottom" sideOffset={4}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Profiles
                </DropdownMenuLabel>
                {profiles.map((profile, index) => (
                  <DropdownMenuItem key={profile.id} onClick={() => switchTo(profile)} className="gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className={cn(profile.color, "text-[10px] font-semibold text-white")}>
                        {profile.name.trim().charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{profile.name}</span>
                    {index < 9 && <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>}
                    {profile.hasPassword && profile.id !== activeProfileId && (
                      <Lock className="size-3 text-muted-foreground" />
                    )}
                    {profile.id === activeProfileId && <Check className="size-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" disabled={creatingProfile} onClick={addProfile}>
                    <div className="flex size-6 items-center justify-center rounded-md border border-border bg-background">
                      {creatingProfile ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </div>
                    <span className="font-medium text-muted-foreground">Add Profile</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog
        open={!!unlockProfile}
        onOpenChange={(open) => {
          if (!open) setUnlockProfile(null);
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Unlock “{unlockProfile?.name}”</DialogTitle>
            <DialogDescription>This profile is password-protected.</DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            autoFocus
            value={unlockPassword}
            onChange={(e) => {
              setUnlockPassword(e.target.value);
              setUnlockError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitUnlock();
            }}
            placeholder="Password"
          />
          {unlockError && <p className="text-xs text-destructive">{unlockError}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={submitUnlock} disabled={switching || !unlockPassword} className="gap-2">
              {switching && <Loader2 className="size-4 animate-spin" />}
              Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
