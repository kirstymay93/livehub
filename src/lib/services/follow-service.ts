import { prisma } from "@/lib/db";

export class FollowService {
  static async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself");
    }

    return prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  static async unfollow(followerId: string, followingId: string) {
    return prisma.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });
  }

  static async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return !!follow;
  }

  static async getFollowerCount(userId: string): Promise<number> {
    return prisma.follow.count({
      where: { followingId: userId },
    });
  }

  static async getFollowingCount(userId: string): Promise<number> {
    return prisma.follow.count({
      where: { followerId: userId },
    });
  }

  static async getFollowers(userId: string, limit: number = 20) {
    return prisma.follow.findMany({
      where: { followingId: userId },
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  static async getFollowing(userId: string, limit: number = 20) {
    return prisma.follow.findMany({
      where: { followerId: userId },
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }
}
