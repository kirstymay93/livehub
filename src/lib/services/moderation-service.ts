const BLOCKED_WORDS = [
  // Add moderation terms as needed
  "badword1",
  "badword2",
];

const MESSAGE_LENGTH_LIMIT = 500;
const MESSAGE_RATE_LIMIT = {
  messages: 5,
  windowMs: 60000, // 1 minute
};

export class ModerationService {
  static validateMessage(message: string): { valid: boolean; error?: string } {
    if (message.trim().length === 0) {
      return { valid: false, error: "Message cannot be empty" };
    }

    if (message.length > MESSAGE_LENGTH_LIMIT) {
      return { valid: false, error: `Message exceeds ${MESSAGE_LENGTH_LIMIT} characters` };
    }

    if (this.containsBlockedWords(message)) {
      return { valid: false, error: "Message contains inappropriate content" };
    }

    return { valid: true };
  }

  private static containsBlockedWords(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return BLOCKED_WORDS.some((word) => lowerMessage.includes(word));
  }

  static sanitizeMessage(message: string): string {
    // Remove any potential XSS vectors
    return message
      .replace(/[<>]/g, "")
      .trim()
      .substring(0, MESSAGE_LENGTH_LIMIT);
  }

  static shouldRateLimit(
    userId: string,
    userMessageCounts: Map<string, { count: number; resetTime: number }>
  ): boolean {
    const now = Date.now();
    const userCount = userMessageCounts.get(userId);

    if (!userCount || now > userCount.resetTime) {
      userMessageCounts.set(userId, {
        count: 1,
        resetTime: now + MESSAGE_RATE_LIMIT.windowMs,
      });
      return false;
    }

    if (userCount.count >= MESSAGE_RATE_LIMIT.messages) {
      return true;
    }

    userCount.count++;
    return false;
  }
}
