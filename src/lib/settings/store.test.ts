import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDriver } from "@/lib/storage/test-helpers";
import { DEFAULT_SETTINGS } from "./types";

const driver = createMemoryDriver();
vi.mock("@/lib/storage", () => ({
  getStorage: () => driver,
}));

const { getSettings, updateSettings } = await import("./store");

beforeEach(() => {
  driver.files.clear();
});

describe("getSettings", () => {
  it("returns the defaults when nothing has been saved", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("fills in missing top-level fields with defaults for a partial stored object", async () => {
    await driver.put("settings.json", Buffer.from(JSON.stringify({ booksPerPage: 100 })), "application/json");
    const settings = await getSettings();
    expect(settings.booksPerPage).toBe(100);
    expect(settings.metadataCandidateLimit).toBe(DEFAULT_SETTINGS.metadataCandidateLimit);
  });
});

describe("updateSettings", () => {
  it("persists a patch on top of the defaults", async () => {
    const settings = await updateSettings({ trendingEnabled: false });
    expect(settings.trendingEnabled).toBe(false);
    expect(settings.booksPerPage).toBe(DEFAULT_SETTINGS.booksPerPage);
    expect(await getSettings()).toEqual(settings);
  });

  it("merges the smtp sub-object instead of replacing it wholesale", async () => {
    await updateSettings({ smtp: { host: "smtp.example.com", port: 587 } });
    const settings = await updateSettings({ smtp: { user: "me" } });
    expect(settings.smtp).toEqual({ host: "smtp.example.com", port: 587, user: "me" });
  });

  it("applies successive patches cumulatively", async () => {
    await updateSettings({ booksPerPage: 20 });
    const settings = await updateSettings({ searchResultLimit: 5 });
    expect(settings).toMatchObject({ booksPerPage: 20, searchResultLimit: 5 });
  });
});
