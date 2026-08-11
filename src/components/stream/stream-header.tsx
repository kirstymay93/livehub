"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart, Share2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatViewerCount } from "@/lib/utils";

interface StreamHeaderProps {
  streamId: string;
  title: string;
  creatorName: string;
  creatorAvatar?: string;
  viewerCount: number;
  category: string;
  description?: string;
  isCreator: boolean;
}

const StreamHeader = ({
  streamId: _streamId,
  title,
  creatorName,
  creatorAvatar,
  viewerCount,
  category,
  description,
  isCreator,
}: StreamHeaderProps) => {
  const { data: session } = useSession();
  const [isFavourited, setIsFavourited] = useState(false);

  const handleFavourite = () => {
    setIsFavourited(!isFavourited);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{category}</Badge>
            <span className="text-sm text-gray-400">
              {formatViewerCount(viewerCount)} watching
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={isFavourited ? "primary" : "secondary"}
            onClick={handleFavourite}
          >
            <Heart size={16} fill={isFavourited ? "currentColor" : "none"} />
            {isFavourited ? "Favourited" : "Favourite"}
          </Button>
          <Button size="sm" variant="secondary">
            <Share2 size={16} />
            Share
          </Button>
          {session?.user && !isCreator && (
            <Button size="sm" variant="secondary">
              <Flag size={16} />
              Report
            </Button>
          )}
        </div>
      </div>

      {/* Creator Info */}
      <div className="flex items-center gap-3 p-4 bg-livehub-hover rounded-lg">
        <Avatar
          src={creatorAvatar}
          initials={creatorName.slice(0, 2).toUpperCase()}
          size="md"
        />
        <div className="flex-1">
          <p className="font-semibold text-white">{creatorName}</p>
          {description && <p className="text-sm text-gray-300 line-clamp-1">{description}</p>}
        </div>
        {!isCreator && (
          <Button size="sm" variant="primary">
            Follow
          </Button>
        )}
      </div>
    </div>
  );
};

export { StreamHeader };
