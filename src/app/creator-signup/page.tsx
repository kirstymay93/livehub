"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CREATOR_CATEGORIES = [
  "Music",
  "Gaming",
  "Fitness",
  "Creative",
  "Just Chatting",
  "Educational",
];

export default function CreatorSignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const canSubmit = useMemo(
    () => selectedCategories.length > 0 && !isSubmitting,
    [isSubmitting, selectedCategories.length]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoadingProfile(false);
      router.replace("/login?callbackUrl=/creator-signup");
      return;
    }

    if (session?.user?.role === "CREATOR" || session?.user?.role === "ADMIN") {
      setIsLoadingProfile(false);
      router.replace("/creator-dashboard");
      return;
    }

    if (!session?.user) {
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/users/me/creator-profile");
        if (response.ok) {
          const data = await response.json();
          if (data.role === "CREATOR" || data.role === "ADMIN") {
            router.replace("/creator-dashboard");
            return;
          }
          setDisplayName(data.profile?.displayName || "");
          setBio(data.profile?.bio || "");
          setSelectedCategories(data.profile?.categories || []);
        }
      } catch (error) {
        console.error("Failed to load creator profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [router, session?.user, status]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : current.length >= 5
          ? current
          : [...current, category]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/me/creator-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          categories: selectedCategories,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to enable creator profile");
      }

      router.push("/creator-dashboard");
      router.refresh();
    } catch (error: any) {
      setMessage(error.message || "Unable to enable creator profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-livehub-border border-t-livehub-accent" />
          <p className="text-gray-400">Preparing creator setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="p-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">Become a creator</h1>
          <p className="text-gray-400">
            Set up your public profile so viewers can discover your streams.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-red-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="creator-display-name"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Display name
            </label>
            <input
              id="creator-display-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={100}
              placeholder={session?.user?.username || "Your creator name"}
              className="w-full rounded-lg border border-livehub-border bg-livehub-hover px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-livehub-accent"
            />
          </div>

          <div>
            <label
              htmlFor="creator-bio"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Bio
            </label>
            <textarea
              id="creator-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Tell viewers what you stream and why they should tune in."
              className="w-full rounded-lg border border-livehub-border bg-livehub-hover px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-livehub-accent"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <label className="block text-sm font-medium text-gray-300">
                Categories
              </label>
              <span className="text-xs text-gray-500">
                Pick up to 5 ({selectedCategories.length}/5)
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {CREATOR_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category);

                return (
                  <Button
                    key={category}
                    type="button"
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!canSubmit}>
              Save and continue
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
