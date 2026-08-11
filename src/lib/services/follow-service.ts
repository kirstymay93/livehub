import { prisma } from '@/lib/db';

export class FollowService {
  static async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
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

  static async isFollowing(followerId: string, followingId: string) {
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

  static async getFollowerCount(userId: string) {
    return prisma.follow.count({
      where: { followingId: userId },
    });
  }

  static async getFollowingCount(userId: string) {
    return prisma.follow.count({
      where: { followerId: userId },
    });
  }

  static async getFollowers(userId: string, limit: number = 50, offset: number = 0) {
    return prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      take: limit,
      skip: offset,
    });
  }
}
