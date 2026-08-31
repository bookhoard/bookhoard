"use client";

import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Book } from "@/lib/books/types";

interface TagFilterMenuProps {
  books: Book[];
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilterMenu({ books, value, onChange }: TagFilterMenuProps) {
  const allTags = Array.from(new Set(books.flatMap((b) => b.tags ?? []))).sort((a, b) =>
    a.localeCompare(b)
  );

  if (allTags.length === 0) return null;

  const toggle = (tag: string, checked: boolean) => {
    onChange(checked ? [...value, tag] : value.filter((t) => t !== tag));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
            <Tag className="size-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              {value.length > 0 ? `Tags (${value.length})` : "Tags"}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        {allTags.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag}
            checked={value.includes(tag)}
            onCheckedChange={(checked) => toggle(tag, checked)}
            closeOnClick={false}
          >
            {tag}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
