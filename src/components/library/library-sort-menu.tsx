"use client";

import { ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BOOK_SORT_OPTIONS, type BookSort } from "@/lib/books/sort";

interface LibrarySortMenuProps {
  value: BookSort;
  onChange: (sort: BookSort) => void;
}

export function LibrarySortMenu({ value, onChange }: LibrarySortMenuProps) {
  const current = BOOK_SORT_OPTIONS.find((o) => o.id === value) ?? BOOK_SORT_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
            <ArrowDownUp className="size-3.5 shrink-0" />
            <span className="whitespace-nowrap">{current.label}</span>
          </Button>
        }
      />
      {/* Fixed width, independent of the trigger — the popup defaults to
          w-(--anchor-width), so it would otherwise shrink to match a short
          trigger label (e.g. "Read first") and wrap longer options
          (e.g. "Recently added") inside itself. */}
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as BookSort)}
        >
          {BOOK_SORT_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.id} value={opt.id} closeOnClick>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
