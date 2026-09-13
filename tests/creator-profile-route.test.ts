import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { GET, PUT } from "@/app/api/users/me/creator-profile/route";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(auth);
const mockedUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockedTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

function getRequest() {
  return new NextRequest("http://localhost/api/users/me/creator-profile");
}

function putRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/users/me/creator-profile", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("creator profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("rejects unauthenticated profile reads", async () => {
    mockedAuth.mockResolvedValue(null as never);

    const response = await GET(getRequest());

    expect(response.status).toBe(401);
  });

  it("returns 404 when the authenticated user no longer exists", async () => {
    mockedUserFindUnique.mockResolvedValue(null);

    const response = await GET(getRequest());

    expect(response.status).toBe(404);
  });

  it("trims fields, normalizes categories, and promotes creators when onboarding completes", async () => {
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          username: "streamer",
          role: UserRole.VIEWER,
        }),
        update: vi.fn().mockResolvedValue({
          id: "user-1",
          username: "streamer",
          role: UserRole.CREATOR,
        }),
      },
      creatorProfile: {
        upsert: vi.fn().mockResolvedValue({
          displayName: "Streamer",
          bio: "Hello world",
          categories: ["Music", "Gaming"],
        }),
      },
    };

    mockedTransaction.mockImplementation(async (callback) => callback(tx as never));

    const response = await PUT(
      putRequest({
        displayName: "  Streamer  ",
        bio: "  Hello world  ",
        categories: [" Music ", "Gaming", "Music", "", "   "],
        activateCreator: true,
      })
    );

    expect(response.status).toBe(200);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { role: UserRole.CREATOR },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
    expect(tx.creatorProfile.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: {
        displayName: "Streamer",
        bio: "Hello world",
        categories: ["Music", "Gaming"],
      },
      create: {
        userId: "user-1",
        displayName: "Streamer",
        bio: "Hello world",
        categories: ["Music", "Gaming"],
      },
      select: {
        displayName: true,
        bio: true,
        categories: true,
      },
    });
  });

  it("keeps the current role and coerces invalid categories input on draft saves", async () => {
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-1",
          username: "streamer",
          role: UserRole.VIEWER,
        }),
        update: vi.fn(),
      },
      creatorProfile: {
        upsert: vi.fn().mockResolvedValue({
          displayName: null,
          bio: null,
          categories: [],
        }),
      },
    };

    mockedTransaction.mockImplementation(async (callback) => callback(tx as never));

    const response = await PUT(
      putRequest({
        displayName: "   ",
        bio: "   ",
        categories: "not-an-array",
      } as never)
    );

    expect(response.status).toBe(200);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.creatorProfile.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: {
        displayName: null,
        bio: null,
        categories: [],
      },
      create: {
        userId: "user-1",
        displayName: null,
        bio: null,
        categories: [],
      },
      select: {
        displayName: true,
        bio: true,
        categories: true,
      },
    });
  });

  it("rejects mixed-type category arrays", async () => {
    const response = await PUT(
      putRequest({
        categories: ["Music", 123],
      } as never)
    );

    expect(response.status).toBe(400);
  });
});
