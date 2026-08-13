import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StreamStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stream = await prisma.stream.findUnique({
      where: { id },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === "go-live") {
      const updated = await prisma.stream.update({
        where: { id },
        data: {
          status: StreamStatus.LIVE,
          startedAt: new Date(),
          endedAt: null,
          liveKitRoom: stream.liveKitRoom || `livehub_${stream.id}_${Date.now()}`,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "end-stream") {
      const updated = await prisma.stream.update({
        where: { id },
        data: {
          status: StreamStatus.ENDED,
          endedAt: new Date(),
          viewerCount: 0,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating stream lifecycle:", error);
    return NextResponse.json(
      { error: "Failed to update stream lifecycle" },
      { status: 500 }
    );
  }
}
