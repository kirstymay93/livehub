import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { StreamService } from "@/lib/services/stream-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let streams;

    if (category) {
      streams = await StreamService.getStreamsByCategory(category, limit, offset);
    } else {
      streams = await StreamService.getActiveStreams(limit, offset);
    }

    return NextResponse.json(streams);
  } catch (error) {
    console.error("Error fetching streams:", error);
    return NextResponse.json(
      { error: "Failed to fetch streams" },
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

    const { title, description, category } = await request.json();

    if (!title || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const stream = await StreamService.createStream(
      session.user.id!,
      title,
      description || "",
      category
    );

    return NextResponse.json(stream, { status: 201 });
  } catch (error) {
    console.error("Error creating stream:", error);
    return NextResponse.json(
      { error: "Failed to create stream" },
      { status: 500 }
    );
  }
}
