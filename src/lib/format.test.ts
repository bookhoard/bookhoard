import { describe, expect, it } from "vitest";
import { formatAddedDate, formatBytes } from "./format";

describe("formatBytes", () => {
  it("formats sub-KB sizes as bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("switches to KB at the 1024 boundary", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("switches to MB at the 1024 KB boundary", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });

  it("switches to GB at the 1024 MB boundary", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
  });

  it("caps at GB instead of continuing to TB", () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1024 GB");
  });

  it("drops the decimal once the value reaches double digits", () => {
    expect(formatBytes(10 * 1024)).toBe("10 KB");
    expect(formatBytes(9.5 * 1024)).toBe("9.5 KB");
  });
});

describe("formatAddedDate", () => {
  it("formats an ISO date as a long-form date", () => {
    const formatted = formatAddedDate("2024-03-15T12:00:00.000Z");
    expect(formatted).toContain("2024");
    expect(formatted).toMatch(/March/);
  });
});
