import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CreatorBroadcastStudio } from "@/components/stream/creator-broadcast-studio";


export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN") {
    redirect("/settings");
  }

  let stream = await prisma.stream.findFirst({
    where: { creatorId: session.user.id, status: { not: "ENDED" } },
    orderBy: { createdAt: "desc" },
  });

  if (!stream) {
    stream = await prisma.stream.create({
      data: {
        creatorId: session.user.id,
        title: `${session.user.username || "Creator"}'s Live Stream`,
        category: "Just Chatting",
        description: "Welcome to my live stream!",
        status: "OFFLINE",
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Creator Studio
          </h1>
          <p className="text-sm text-gray-400">
            Manage your broadcast and go live with LiveKit
          </p>
        </div>
      </div>

      <CreatorBroadcastStudio
        streamId={stream.id}
        initialTitle={stream.title}
      />
    </div>
  );
}
