"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCard, type BookCardActions } from "./book-card";
import type { Book } from "@/lib/books/types";

interface BookRowProps {
  title: string;
  books: Book[];
  selectedId?: string;
  onSelect: (book: Book) => void;
  actions: BookCardActions;
}

export function BookRow({ title, books, selectedId, onSelect, actions }: BookRowProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold tracking-tight">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-7 rounded-full"
            aria-label="Scroll left"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7 rounded-full"
            aria-label="Scroll right"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            selected={book.id === selectedId}
            onSelect={onSelect}
            actions={actions}
          />
        ))}
      </div>
    </section>
  );
}
