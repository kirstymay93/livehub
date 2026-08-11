"use client";

import React from "react";
import Link from "next/link";
import { formatViewerCount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface StreamCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  creatorName: string;
  creatorAvatar?: string;
  category: string;
  viewerCount: number;
  isLive: boolean;
}

const StreamCard = ({
  id,
  title,
  thumbnail,
  creatorName,
  creatorAvatar,
  category,
  viewerCount,
  isLive,
}: StreamCardProps) => {
  return (
    <Link href={`/stream/${id}`}>
      <Card className="overflow-hidden hover:border-livehub-accent transition-colors cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-livehub-hover overflow-hidden">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          )}
          {isLive && (
            <div className="absolute top-2 left-2">
              <Badge variant="danger">LIVE</Badge>
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur px-2 py-1 rounded text-xs text-white flex items-center gap-1">
            <Eye size={12} />
            {formatViewerCount(viewerCount)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-white line-clamp-2 hover:text-livehub-accent transition-colors">
            {title}
          </h3>

          {/* Creator Info */}
          <div className="flex items-center gap-2">
            <Avatar
              src={creatorAvatar}
              initials={creatorName.slice(0, 2).toUpperCase()}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate font-medium">{creatorName}</p>
              <p className="text-xs text-gray-400">{category}</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export { StreamCard };
