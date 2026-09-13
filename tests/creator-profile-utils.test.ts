import { describe, expect, it } from "vitest";
import { normalizeCreatorCategories } from "@/lib/creator-profile";

describe("normalizeCreatorCategories", () => {
  it("trims categories, removes blanks, and deduplicates in order", () => {
    expect(
      normalizeCreatorCategories([
        " Music ",
        "",
        "Gaming",
        "Music",
        "  ",
        "Creative",
      ])
    ).toEqual(["Music", "Gaming", "Creative"]);
  });

  it("limits the list to five categories", () => {
    expect(
      normalizeCreatorCategories([
        "Music",
        "Gaming",
        "Fitness",
        "Creative",
        "Just Chatting",
        "Educational",
      ])
    ).toEqual([
      "Music",
      "Gaming",
      "Fitness",
      "Creative",
      "Just Chatting",
    ]);
  });
});
