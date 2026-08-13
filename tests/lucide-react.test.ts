import { describe, expect, it } from "vitest";
import { GitFork, Search } from "lucide-react";

describe("lucide-react integration", () => {
  it("exports the icons used by LiveHub", () => {
    expect(Search).toBeDefined();
    expect(GitFork).toBeDefined();
  });
});
