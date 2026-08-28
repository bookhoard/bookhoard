"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
      <button
        type="button"
        aria-label="Light theme"
        onClick={() => setTheme("light")}
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-colors",
          !isDark ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Dark theme"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-colors",
          isDark ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="size-3.5" />
      </button>
    </div>
  );
}
