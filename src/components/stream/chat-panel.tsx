"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { chatService } from "@/lib/services/chat-service";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
}

interface ChatPanelProps {
  streamId: string;
}

const ChatPanel = ({ streamId }: ChatPanelProps) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial messages
    const initialMessages = chatService.getMessages(streamId);
    setMessages(initialMessages);
  }, [streamId]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !session?.user) {
      return;
    }

    setIsLoading(true);
    try {
      const message = chatService.addMessage(
        streamId,
        session.user.id!,
        session.user.username || "Anonymous",
        newMessage,
        session.user.image || undefined
      );

      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-livehub-border">
        <h2 className="font-semibold text-white">Live Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex gap-2 text-sm">
              <Avatar
                src={message.avatar}
                initials={message.username.slice(0, 2).toUpperCase()}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-medium text-white text-xs">{message.username}</p>
                  <p className="text-xs text-gray-400">{formatTime(message.timestamp)}</p>
                </div>
                <p className="text-gray-200 break-words">{message.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {session?.user ? (
        <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-livehub-border">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Say something..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-livehub-hover border border-livehub-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-livehub-accent disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              isLoading={isLoading}
              disabled={!newMessage.trim()}
            >
              <Send size={16} />
            </Button>
          </div>
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-livehub-border text-center text-gray-400 text-sm">
          Sign in to chat
        </div>
      )}
    </Card>
  );
};

export { ChatPanel };
