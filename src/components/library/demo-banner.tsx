import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
      <Info className="size-4 shrink-0" aria-hidden="true" />
      <span>
        This is a read-only demo — uploads and changes are disabled.{" "}
        <a
          href="https://docs.bookhoarder.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:no-underline"
        >
          Read the docs to deploy your own
        </a>
        .
      </span>
    </div>
  );
}
