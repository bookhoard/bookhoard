"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import type { Book } from "@/lib/books/types";

interface RateDialogProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRate: (rating: number) => void;
}

export function RateDialog({ book, open, onOpenChange, onRate }: RateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Rate this book</DialogTitle>
          <DialogDescription className="truncate">{book.title}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <StarRating value={book.rating} onChange={onRate} size={28} className="gap-1.5" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
