import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("The Great Gatsby")).toBe("the-great-gatsby");
  });

  it("strips diacritics", () => {
    expect(slugify("Émile Zola")).toBe("emile-zola");
  });

  it("collapses runs of non-alphanumeric characters into one hyphen", () => {
    expect(slugify("A!!  B__C")).toBe("a-b-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -- Hello --  ")).toBe("hello");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(100);
    const slug = slugify(long);
    expect(slug.length).toBeLessThanOrEqual(60);
  });

  it("does not leave a trailing hyphen after truncation", () => {
    const input = "a".repeat(59) + "- " + "b".repeat(10);
    expect(slugify(input).endsWith("-")).toBe(false);
  });

  it("falls back to 'book' when nothing alphanumeric remains", () => {
    expect(slugify("!!! ???")).toBe("book");
    expect(slugify("")).toBe("book");
  });
});
