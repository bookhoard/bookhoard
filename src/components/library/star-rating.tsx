"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
}

export function StarRating({ value = 0, onChange, size = 16, className }: StarRatingProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onClick={() => onChange(star === value ? 0 : star)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Star
            style={{ width: size, height: size }}
            className={star <= display ? "fill-foreground text-foreground" : "fill-none"}
          />
        </button>
      ))}
    </div>
  );
}
