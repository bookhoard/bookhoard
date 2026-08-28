"use client";

import { SettingsPanel } from "@/components/settings/settings-panel";
import { useLibraryShell } from "@/components/library/library-shell-context";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function SettingsPage() {
  useDocumentTitle("Settings");
  const { settings, activeProfile } = useLibraryShell();
  return <SettingsPanel settings={settings} profile={activeProfile} />;
}
