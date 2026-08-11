import { prisma } from '@/lib/db';
import { StreamStatus } from '@prisma/client';

export class StreamService {
  static async getActiveStreams(limit: number = 20, offset: number = 0) {
    return prisma.stream.findMany({
      where: { status: StreamStatus.LIVE },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { viewerCount: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  static async getStreamsByCategory(category: string, limit: number = 20, offset: number = 0) {
    return prisma.stream.findMany({
      where: {
        category,
        status: StreamStatus.LIVE,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { viewerCount: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  static async getStreamById(id: string) {
    return prisma.stream.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        chatMessages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  static async createStream(creatorId: string, title: string, description: string, category: string) {
    return prisma.stream.create({
      data: {
        creatorId,
        title,
        description,
        category,
        status: StreamStatus.OFFLINE,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  static async goLive(streamId: string) {
    return prisma.stream.update({
      where: { id: streamId },
      data: {
        status: StreamStatus.LIVE,
        startedAt: new Date(),
      },
    });
  }

  static async endStream(streamId: string) {
    return prisma.stream.update({
      where: { id: streamId },
      data: {
        status: StreamStatus.ENDED,
        endedAt: new Date(),
      },
    });
  }

  static async updateViewerCount(streamId: string, count: number) {
    return prisma.stream.update({
      where: { id: streamId },
      data: { viewerCount: count },
    });
  }
}
