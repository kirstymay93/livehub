import { prisma } from '@/lib/db';

export class ChatService {
  static async addMessage(streamId: string, userId: string, message: string) {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (message.length > 500) {
      throw new Error('Message is too long');
    }

    return prisma.chatMessage.create({
      data: {
        streamId,
        userId,
        message: message.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  static async getMessages(streamId: string, limit: number = 50) {
    return prisma.chatMessage.findMany({
      where: { streamId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
}
