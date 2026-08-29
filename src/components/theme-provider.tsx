"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

// Mirrors the resolved theme into a cookie so the root layout can read it
// server-side and render the correct <html class> on the first response —
// localStorage alone can't do that, since the server can't see it, which is
// what caused a white flash on cold loads/new tabs before this existed.
function ThemeCookieSync() {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (!resolvedTheme) return;
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `theme=${resolvedTheme}; path=/; max-age=31536000; samesite=lax${secure}`;
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeCookieSync />
      {children}
    </NextThemesProvider>
  );
}
