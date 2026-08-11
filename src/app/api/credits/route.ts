import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CreditService } from "@/lib/services/credit-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, amount, description, creatorUserId } = await request.json();

    if (!action || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action === "add") {
      await CreditService.addCredits(
        session.user.id!,
        amount,
        description || "Credit purchase"
      );
      return NextResponse.json({ message: "Credits added successfully" });
    } else if (action === "tip") {
      if (!creatorUserId) {
        return NextResponse.json(
          { error: "Creator ID required for tip" },
          { status: 400 }
        );
      }
      await CreditService.tipCreator(
        session.user.id!,
        creatorUserId,
        amount
      );
      return NextResponse.json({ message: "Tip sent successfully" });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error processing credits:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process credits" },
      { status: 500 }
    );
  }
}
