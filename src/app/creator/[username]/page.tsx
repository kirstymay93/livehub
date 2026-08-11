"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp } from "lucide-react";

interface CreatorProfilePageProps {
  params: { username: string };
}

export default function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { data: session } = useSession();
  const [creator, setCreator] = useState<any>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        const res = await fetch(`/api/creators/${params.username}`);
        if (res.ok) {
          const data = await res.json();
          setCreator(data.creator);
          setStreams(data.streams);
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Failed to fetch creator:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorData();
  }, [params.username]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-livehub-border border-t-livehub-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-2">Creator Not Found</h2>
          <p className="text-gray-400 mb-6">This creator doesn't exist or has been removed.</p>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const handleFollow = async () => {
    if (!session?.user) return;

    try {
      const res = await fetch(`/api/users/${creator.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isFollowing ? "unfollow" : "follow",
        }),
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-livehub-accent to-pink-500 rounded-lg mb-8 overflow-hidden">
        {creator.banner && (
          <img src={creator.banner} alt="banner" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Section */}
      <Card className="p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Avatar
              src={creator.avatar}
              initials={creator.username.slice(0, 2).toUpperCase()}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-white">{creator.username}</h1>
                {creator.verified && <Badge variant="primary">Verified</Badge>}
              </div>
              {creator.bio && <p className="text-gray-300 mb-4">{creator.bio}</p>}
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Followers</p>
                  <p className="text-2xl font-bold text-white">{creator.followerCount}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-2xl font-bold text-white">{creator.totalViews}</p>
                </div>
              </div>
            </div>
          </div>

          {session?.user?.id !== creator.id && (
            <Button
              variant={isFollowing ? "primary" : "secondary"}
              size="lg"
              onClick={handleFollow}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>
      </Card>

      {/* Categories */}
      {creator.categories && creator.categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {creator.categories.map((category: string) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Streams */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp size={24} />
          {creator.isLive ? "Live Now" : "Recent Streams"}
        </h2>

        {streams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <Card key={stream.id} className="overflow-hidden hover:border-livehub-accent transition-colors cursor-pointer">
                <div className="aspect-video bg-livehub-hover flex items-center justify-center">
                  {stream.status === "LIVE" && (
                    <Badge variant="danger" className="absolute top-2 left-2 z-10">
                      LIVE
                    </Badge>
                  )}
                  <p className="text-gray-400">{stream.title}</p>
                </div>
                <div className="p-4">
                  <p className="font-medium text-white line-clamp-2">{stream.title}</p>
                  <p className="text-sm text-gray-400 mt-2">{stream.category}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-400 text-lg">No streams yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}
