import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ViewerStreamPlayer } from "@/components/stream/viewer-stream-player";
import { ChatPanel } from "@/components/stream/chat-panel";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StreamPage(
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const stream = await prisma.stream.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, username: true, avatar: true },
      },
    },
  });

  if (!stream) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <ViewerStreamPlayer streamId={stream.id} status={stream.status} />
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={stream.creator.avatar || undefined}
                  initials={stream.creator.username.slice(0, 2).toUpperCase()}
                  size="lg"
                />
                <div>
                  <h1 className="text-xl font-bold text-white mb-1">
                    {stream.title}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {stream.creator.username} •{" "}
                    <span className="text-livehub-accent">
                      {stream.category}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-livehub-hover px-3 py-1.5 rounded-lg border border-livehub-border text-sm text-gray-300">
                <Eye size={16} className="text-livehub-accent" />
                <span>{stream.viewerCount} watching</span>
              </div>
            </div>
            {stream.description && (
              <p className="mt-4 text-gray-300 text-sm whitespace-pre-wrap border-t border-livehub-border pt-4">
                {stream.description}
              </p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 h-[75vh] min-h-[500px]">
          <ChatPanel streamId={stream.id} />
        </div>
      </div>
    </div>
  );
}
