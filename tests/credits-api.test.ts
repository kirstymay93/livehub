import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { CreditService } from "@/lib/services/credit-service";
import { POST } from "@/app/api/credits/route";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/services/credit-service", () => ({
  CreditService: {
    tipCreator: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(auth);
const mockedTipCreator = vi.mocked(CreditService.tipCreator);

function request(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/credits", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/credits security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue(null as never);
  });

  it("rejects unauthenticated requests before calling the service", async () => {
    const response = await POST(
      request({
        action: "tip",
        creatorUserId: "creator",
        amount: 10,
        idempotencyKey: "unauthenticated-key-0001",
      })
    );

    expect(response.status).toBe(401);
    expect(mockedTipCreator).not.toHaveBeenCalled();
  });

  it("uses the authenticated session sender and ignores client-supplied sender IDs", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "session-sender" } } as never);
    mockedTipCreator.mockResolvedValue({
      referenceId: "reference-1",
      senderBalance: 90,
      creatorBalance: 10,
    });

    const response = await POST(
      request(
        {
          action: "tip",
          senderId: "attacker-supplied-sender",
          creatorUserId: "creator",
          amount: 10,
          idempotencyKey: "sender-identity-key-0001",
        },
        { "Idempotency-Key": "header-idempotency-key-0001" }
      )
    );

    expect(response.status).toBe(200);
    expect(mockedTipCreator).toHaveBeenCalledWith(
      "session-sender",
      "creator",
      10,
      "header-idempotency-key-0001"
    );
  });

  it("requires a valid idempotency key", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "session-sender" } } as never);

    const response = await POST(
      request({ action: "tip", creatorUserId: "creator", amount: 10 })
    );

    expect(response.status).toBe(400);
    expect(mockedTipCreator).not.toHaveBeenCalled();
  });

  it("blocks arbitrary credit minting through the add action", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "session-sender" } } as never);

    const response = await POST(
      request({
        action: "add",
        amount: 999999,
        idempotencyKey: "credit-minting-key-0001",
      })
    );

    expect(response.status).toBe(403);
    expect(mockedTipCreator).not.toHaveBeenCalled();
  });
});
