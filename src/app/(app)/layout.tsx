import { cookies } from "next/headers";
import { readJson } from "@/lib/store";
import type { BookRecord } from "@/lib/books/types";
import { getActiveProfile, listProfiles } from "@/lib/profiles/store";
import { applyProfileState, getProfileState } from "@/lib/profiles/state";
import { getSettings } from "@/lib/settings/store";
import { toPublicSettings } from "@/lib/settings/types";
import { toPublicProfile } from "@/lib/profiles/types";
import { LibraryShellProvider } from "@/components/library/library-shell-context";
import { AppShell } from "@/components/library/app-shell";

export const dynamic = "force-dynamic";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [records, profiles, activeProfile, settings, cookieStore] = await Promise.all([
    readJson<BookRecord[]>("index.json").then((r) => r ?? []),
    listProfiles(),
    getActiveProfile(),
    getSettings(),
    cookies(),
  ]);

  const state = await getProfileState(activeProfile.id);
  const books = records.map((record) => applyProfileState(record, state[record.id]));
  const sidebarCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return (
    <LibraryShellProvider
      key={activeProfile.id}
      initialBooks={books}
      profiles={profiles.map(toPublicProfile)}
      activeProfileId={activeProfile.id}
      settings={toPublicSettings(settings)}
    >
      <AppShell initialSidebarCollapsed={sidebarCollapsed}>{children}</AppShell>
    </LibraryShellProvider>
  );
}
