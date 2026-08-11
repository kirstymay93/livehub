import { chatMessageSchema } from "@/lib/validation";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
}

interface ChatRoom {
  streamId: string;
  messages: ChatMessage[];
}

class MockChatService {
  private rooms: Map<string, ChatRoom> = new Map();

  initializeRoom(streamId: string): void {
    if (!this.rooms.has(streamId)) {
      this.rooms.set(streamId, { streamId, messages: [] });
    }
  }

  addMessage(
    streamId: string,
    userId: string,
    username: string,
    message: string,
    avatar?: string
  ): ChatMessage {
    this.initializeRoom(streamId);

    const validated = chatMessageSchema.parse({ message });
    const room = this.rooms.get(streamId)!;

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      userId,
      username,
      avatar,
      message: validated.message,
      timestamp: new Date(),
    };

    room.messages.push(chatMessage);

    // Keep only last 100 messages in memory
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    return chatMessage;
  }

  getMessages(streamId: string): ChatMessage[] {
    this.initializeRoom(streamId);
    return this.rooms.get(streamId)?.messages ?? [];
  }

  clearRoom(streamId: string): void {
    this.rooms.delete(streamId);
  }
}

export const chatService = new MockChatService();

export async function saveChatMessageToDb(
  streamId: string,
  userId: string,
  message: string
) {
  const { prisma } = await import("@/lib/db");

  return prisma.chatMessage.create({
    data: {
      streamId,
      userId,
      message,
    },
    include: {
      user: {
        select: {
          username: true,
          avatar: true,
        },
      },
    },
  });
}

export async function getStreamChatHistory(streamId: string, limit: number = 50) {
  const { prisma } = await import("@/lib/db");

  return prisma.chatMessage.findMany({
    where: { streamId },
    orderBy: { createdAt: "asc" },
    take: limit,
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
