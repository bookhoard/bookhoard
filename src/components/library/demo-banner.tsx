import { Info } from "lucide-react";
import { DEMO_MODE } from "@/lib/demo-mode";

export function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div className="flex shrink-0 items-center justify-center gap-2 border-b border-border bg-muted px-4 py-2 text-center text-xs font-medium text-muted-foreground">
      <Info className="size-3.5 shrink-0" />
      <span>
        This is a read-only demo — uploads and changes are disabled.{" "}
        <a
          href="https://docs.bookhoarder.dev/deployment/docker/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground underline underline-offset-2 hover:text-foreground/80"
        >
          See the docs to deploy your own
        </a>
      </span>
    </div>
  );
}
