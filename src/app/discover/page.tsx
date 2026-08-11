"use client";

import React, { useState, useEffect } from "react";
import { StreamCard } from "@/components/stream/stream-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

const CATEGORIES = [
  "All",
  "Music",
  "Gaming",
  "Fitness",
  "Creative",
  "Just Chatting",
  "Educational",
];

const SORT_OPTIONS = [
  { value: "viewers", label: "Most Viewers" },
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
];

export default function DiscoverPage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("viewers");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchStreams = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== "All") {
          params.set("category", selectedCategory);
        }
        if (sortBy) {
          params.set("sort", sortBy);
        }
        if (searchQuery) {
          params.set("search", searchQuery);
        }

        const res = await fetch(`/api/streams?${params.toString()}`);
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

    const debounceTimer = setTimeout(fetchStreams, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, sortBy, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search streams or creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-livehub-card border border-livehub-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-livehub-accent"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter size={20} />
            Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden text-livehub-accent hover:text-livehub-accent-hover"
          >
            {showFilters ? "Hide" : "Show"}
          </button>
        </div>

        {(showFilters || window.innerWidth >= 768) && (
          <>
            {/* Categories */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Sort By</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Streams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-livehub-hover rounded-lg h-80 animate-pulse" />
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
        <Card className="p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No streams found</p>
          <p className="text-gray-500">
            Try adjusting your filters or check back later for new content.
          </p>
        </Card>
      )}
    </div>
  );
}
