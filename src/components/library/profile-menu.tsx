"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Lock, Loader2, Settings, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { cn } from "@/lib/utils";
import { useLibraryShell } from "./library-shell-context";
import type { PublicProfile } from "@/lib/profiles/types";

interface ProfileMenuProps {
  collapsed?: boolean;
}

export function ProfileMenu({ collapsed = false }: ProfileMenuProps) {
  const router = useRouter();
  const { profiles, activeProfileId, activeProfile } = useLibraryShell();
  const [switching, setSwitching] = React.useState(false);
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 text-left hover:bg-accent/50",
                collapsed && "justify-center px-0"
              )}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback
                  className={cn(
                    activeProfile.color,
                    "font-heading text-sm font-semibold text-white"
                  )}
                >
                  {activeProfile.name.trim().charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-semibold">{activeProfile.name}</p>
                    <p className="truncate text-xs text-muted-foreground capitalize">
                      {activeProfile.role}
                    </p>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          }
        />
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Profiles</DropdownMenuLabel>
            {profiles.map((profile) => (
              <DropdownMenuItem key={profile.id} onClick={() => switchTo(profile)}>
                <Avatar className="size-5">
                  <AvatarFallback
                    className={cn(profile.color, "text-[10px] font-semibold text-white")}
                  >
                    {profile.name.trim().charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{profile.name}</span>
                {profile.hasPassword && profile.id !== activeProfileId && (
                  <Lock className="size-3 text-muted-foreground" />
                )}
                {profile.id === activeProfileId && <Check className="size-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<a href="https://docs.bookhoarder.dev" target="_blank" rel="noopener noreferrer" />}
          >
            <FileText className="size-3.5" />
            Documentation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="size-3.5" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
