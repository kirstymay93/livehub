import { describe, expect, it } from "vitest";
import authConfig from "@/auth.config";

describe("auth config session updates", () => {
  it("copies refreshed role and username into the jwt token on session update", async () => {
    const token = await authConfig.callbacks.jwt?.({
      token: {
        id: "user-1",
        role: "VIEWER",
        username: "viewername",
      },
      trigger: "update",
      session: {
        user: {
          id: "user-1",
          role: "CREATOR",
          username: "creatorname",
          email: "viewer@example.com",
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
    } as never);

    expect(token).toMatchObject({
      role: "CREATOR",
      username: "creatorname",
    });
  });
});
