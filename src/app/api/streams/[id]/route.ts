import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StreamService } from "@/lib/services/stream-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stream = await StreamService.getStreamById(params.id);

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    return NextResponse.json(stream);
  } catch (error) {
    console.error("Error fetching stream:", error);
    return NextResponse.json(
      { error: "Failed to fetch stream" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stream = await StreamService.getStreamById(params.id);

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === "go-live") {
      return NextResponse.json(await StreamService.goLive(params.id));
    } else if (action === "end-stream") {
      return NextResponse.json(await StreamService.endStream(params.id));
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating stream:", error);
    return NextResponse.json(
      { error: "Failed to update stream" },
      { status: 500 }
    );
  }
}
