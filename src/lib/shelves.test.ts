import { describe, expect, it } from "vitest";
import { nextShelfColor, SHELF_COLORS } from "./shelves";

describe("nextShelfColor", () => {
  it("cycles through the palette in order", () => {
    expect(nextShelfColor(0)).toBe(SHELF_COLORS[0]);
    expect(nextShelfColor(1)).toBe(SHELF_COLORS[1]);
  });

  it("wraps around once the count exceeds the palette length", () => {
    expect(nextShelfColor(SHELF_COLORS.length)).toBe(SHELF_COLORS[0]);
    expect(nextShelfColor(SHELF_COLORS.length + 2)).toBe(SHELF_COLORS[2]);
  });
});
