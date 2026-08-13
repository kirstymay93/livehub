import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { streamId } = await request.json();
    if (!streamId || typeof streamId !== "string") {
      return NextResponse.json(
        { error: "Valid stream ID is required" },
        { status: 400 }
      );
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.status === "ENDED") {
      return NextResponse.json(
        { error: "This stream has ended" },
        { status: 403 }
      );
    }

    const isCreator = stream.creatorId === session.user.id;
    const roomName =
      stream.liveKitRoom || `livehub_${stream.id}_${Date.now()}`;

    if (!stream.liveKitRoom) {
      await prisma.stream.update({
        where: { id: stream.id },
        data: { liveKitRoom: roomName },
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error("LiveKit environment variables are not configured");
      return NextResponse.json(
        { error: "LiveKit server configuration error" },
        { status: 500 }
      );
    }

    const participantIdentity = `user_${session.user.id}_${Date.now()}`;
    const participantName = session.user.username || "Viewer";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: "2h",
    });

    at.addGrant({
      roomJoin: true,
      room: stream.liveKitRoom || roomName,
      canPublish: isCreator,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      wsUrl,
      roomName: stream.liveKitRoom || roomName,
      isCreator,
    });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: "Failed to generate access token" },
      { status: 500 }
    );
  }
}
