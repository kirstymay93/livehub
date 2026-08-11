import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { FollowService } from "@/lib/services/follow-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isFollowing = await FollowService.isFollowing(
      session.user.id!,
      params.userId
    );

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === "follow") {
      await FollowService.follow(session.user.id!, params.userId);
      return NextResponse.json({ message: "Followed successfully" });
    } else if (action === "unfollow") {
      await FollowService.unfollow(session.user.id!, params.userId);
      return NextResponse.json({ message: "Unfollowed successfully" });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error processing follow:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process follow" },
      { status: 500 }
    );
  }
}
