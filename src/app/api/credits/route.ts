import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CreditService } from "@/lib/services/credit-service";
import { tipSchema } from "@/lib/validators";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const balance = await CreditService.getBalance(session.user.id!);
    return NextResponse.json({ balance });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    if (payload?.action === "add") {
      return NextResponse.json(
        { error: "Credit purchases are not enabled" },
        { status: 403 }
      );
    }

    if (payload?.action !== "tip") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const parsed = tipSchema.safeParse({
      creatorUserId: payload.creatorUserId,
      amount:
        typeof payload.amount === "number"
          ? payload.amount
          : Number(payload.amount),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid tip data" },
        { status: 400 }
      );
    }

    await CreditService.tipCreator(
      session.user.id!,
      parsed.data.creatorUserId,
      parsed.data.amount
    );
    return NextResponse.json({ message: "Tip sent successfully" });
  } catch (error: unknown) {
    console.error("Error processing credits:", error);
    const message = error instanceof Error ? error.message : "";
    const knownErrors = new Set([
      "Insufficient credits",
      "Creator not found",
      "User is not a creator",
      "You cannot tip yourself",
      "Tip amount must be a positive integer",
    ]);
    if (knownErrors.has(message)) {
      const status = message === "Creator not found" ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to process credits" },
      { status: 500 }
    );
  }
}
