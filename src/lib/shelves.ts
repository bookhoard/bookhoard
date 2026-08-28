export interface Shelf {
  id: string;
  name: string;
  color: string;
  bookIds: string[];
}

export const SHELF_COLORS = [
  "bg-blue-500",
  "bg-fuchsia-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-slate-500",
];

export function nextShelfColor(existingCount: number): string {
  return SHELF_COLORS[existingCount % SHELF_COLORS.length];
}
