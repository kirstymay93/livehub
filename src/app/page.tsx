"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StreamCard } from "@/components/stream/stream-card";
import { ArrowRight, Zap, Users, Sparkles } from "lucide-react";

const FEATURED_CATEGORIES = [
  { name: "Music", icon: "🎵", color: "bg-purple-500" },
  { name: "Gaming", icon: "🎮", color: "bg-blue-500" },
  { name: "Fitness", icon: "💪", color: "bg-green-500" },
  { name: "Creative", icon: "🎨", color: "bg-pink-500" },
  { name: "Just Chatting", icon: "💬", color: "bg-yellow-500" },
  { name: "Educational", icon: "📚", color: "bg-indigo-500" },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [streams, setStreams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const res = await fetch("/api/streams?limit=6");
        if (res.ok) {
          const data = await res.json();
          setStreams(data);
        }
      } catch (error) {
        console.error("Failed to fetch streams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, []);

  return (
    <div className="bg-livehub-dark">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
              LIVE. CONNECT.
              <br />
              <span className="bg-gradient-to-r from-livehub-accent to-pink-500 bg-clip-text text-transparent">
                DISCOVER.
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Find something happening right now. Join thousands of creators and viewers streaming live.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/discover">
                <Button size="lg" variant="primary">
                  Browse Live Streams
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              {!session?.user ? (
                <Link href="/register">
                  <Button size="lg" variant="secondary">
                    Become a Creator
                  </Button>
                </Link>
              ) : session.user.role === "VIEWER" ? (
                <Link href="/creator-signup">
                  <Button size="lg" variant="secondary">
                    Become a Creator
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-livehub-card border-y border-livehub-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {FEATURED_CATEGORIES.map((category) => (
              <Link
                key={category.name}
                href={`/discover?category=${encodeURIComponent(category.name)}`}
              >
                <Card className="h-full cursor-pointer hover:border-livehub-accent transition-all">
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <p className="font-medium text-white">{category.name}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Live Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-livehub-accent" size={24} />
                <h2 className="text-3xl font-bold text-white">Featured Live Now</h2>
              </div>
              <p className="text-gray-400">Check out the hottest streams right now</p>
            </div>
            <Link href="/discover">
              <Button variant="ghost">
                View All
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-livehub-hover rounded-lg h-80 animate-pulse"
                />
              ))}
            </div>
          ) : streams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map((stream) => (
                <StreamCard
                  key={stream.id}
                  id={stream.id}
                  title={stream.title}
                  creatorName={stream.creator.username}
                  creatorAvatar={stream.creator.avatar}
                  category={stream.category}
                  viewerCount={stream.viewerCount}
                  isLive={stream.status === "LIVE"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No live streams available right now</p>
              <p className="text-gray-500">Check back soon or follow your favorite creators!</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-livehub-card border-t border-livehub-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Why LiveHub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Sparkles className="text-livehub-accent mb-4" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">Discover New Content</h3>
              <p className="text-gray-400">
                Explore live streams from creators around the world, from gaming and music to educational and creative content.
              </p>
            </Card>
            <Card className="p-6">
              <Users className="text-livehub-accent mb-4" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">Connect & Community</h3>
              <p className="text-gray-400">
                Join live chat, follow your favorite creators, and be part of a thriving community of streamers and viewers.
              </p>
            </Card>
            <Card className="p-6">
              <Zap className="text-livehub-accent mb-4" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">Support Creators</h3>
              <p className="text-gray-400">
                Send tips and credits directly to creators you love. Help support the content that matters to you.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
