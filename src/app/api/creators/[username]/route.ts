import { NextRequest, NextResponse } from "next/server";
import { StreamStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { FollowService } from "@/lib/services/follow-service";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const session = await auth();

    const creator = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        role: true,
        creatorProfile: {
          select: {
            displayName: true,
            bio: true,
            banner: true,
            categories: true,
            totalViews: true,
          },
        },
        _count: {
          select: {
            followedBy: true,
          },
        },
      },
    });

    if (!creator || (creator.role !== UserRole.CREATOR && creator.role !== UserRole.ADMIN)) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const [streams, liveStream, isFollowing] = await Promise.all([
      prisma.stream.findMany({
        where: {
          creatorId: creator.id,
          status: { in: [StreamStatus.OFFLINE, StreamStatus.LIVE, StreamStatus.ENDED] },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
        },
      }),
      prisma.stream.findFirst({
        where: { creatorId: creator.id, status: StreamStatus.LIVE },
        select: { id: true },
      }),
      session?.user?.id && session.user.id !== creator.id
        ? FollowService.isFollowing(session.user.id, creator.id)
        : Promise.resolve(false),
    ]);

    return NextResponse.json({
      creator: {
        id: creator.id,
        username: creator.username,
        displayName: creator.creatorProfile?.displayName || creator.username,
        avatar: creator.avatar,
        banner: creator.creatorProfile?.banner || null,
        bio: creator.creatorProfile?.bio || "",
        categories: creator.creatorProfile?.categories || [],
        followerCount: creator._count.followedBy,
        totalViews: creator.creatorProfile?.totalViews || 0,
        isLive: !!liveStream,
        verified: creator.role === UserRole.ADMIN,
      },
      streams,
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching creator:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator" },
      { status: 500 }
    );
  }
}
