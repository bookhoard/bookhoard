import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, toPublicSettings } from "./types";

describe("toPublicSettings", () => {
  it("strips the smtp password and exposes hasPassword instead", () => {
    const settings = { ...DEFAULT_SETTINGS, smtp: { host: "smtp.example.com", pass: "secret" } };
    const pub = toPublicSettings(settings);
    expect(pub.smtp).not.toHaveProperty("pass");
    expect(pub.smtp.hasPassword).toBe(true);
    expect(pub.smtp.host).toBe("smtp.example.com");
  });

  it("reports hasPassword false when no password is set", () => {
    const pub = toPublicSettings(DEFAULT_SETTINGS);
    expect(pub.smtp.hasPassword).toBe(false);
  });
});
