import { prisma } from "@/lib/db";

export class StreamService {
  static async getActiveStreams(limit: number = 20, offset: number = 0) {
    return prisma.stream.findMany({
      where: { status: "LIVE" },
      orderBy: { viewerCount: "desc" },
      take: limit,
      skip: offset,
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

  static async getStreamsByCategory(
    category: string,
    limit: number = 20,
    offset: number = 0
  ) {
    return prisma.stream.findMany({
      where: { category, status: "LIVE" },
      orderBy: { viewerCount: "desc" },
      take: limit,
      skip: offset,
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
      },
    });
  }

  static async createStream(
    creatorId: string,
    title: string,
    description: string,
    category: string
  ) {
    return prisma.stream.create({
      data: {
        creatorId,
        title,
        description,
        category,
        status: "OFFLINE",
      },
    });
  }

  static async goLive(streamId: string) {
    return prisma.stream.update({
      where: { id: streamId },
      data: {
        status: "LIVE",
        startedAt: new Date(),
      },
    });
  }

  static async endStream(streamId: string) {
    return prisma.stream.update({
      where: { id: streamId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });
  }

  static async updateViewerCount(streamId: string, viewerCount: number) {
    return prisma.stream.update({
      where: { id: streamId },
      data: { viewerCount },
    });
  }

  static async getCreatorActiveStream(creatorId: string) {
    return prisma.stream.findFirst({
      where: { creatorId, status: "LIVE" },
    });
  }

  static async getCreatorStreams(creatorId: string, limit: number = 20) {
    return prisma.stream.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
