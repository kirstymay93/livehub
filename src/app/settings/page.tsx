"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/users/me/settings");
        if (res.ok) {
          const data = await res.json();
          setFormData(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users/me/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-livehub-border border-t-livehub-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500/50 text-green-200"
              : "bg-red-500/20 border border-red-500/50 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="p-8">
        <div className="space-y-6">
          {/* Account Settings */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={formData?.email || ""}
                  className="w-full px-4 py-2 bg-livehub-hover border border-livehub-border rounded-lg text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={formData?.username || ""}
                  className="w-full px-4 py-2 bg-livehub-hover border border-livehub-border rounded-lg text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="pt-4 border-t border-livehub-border">
            <h2 className="text-xl font-bold text-white mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded bg-livehub-hover border-livehub-border text-livehub-accent"
                />
                <span className="ml-3 text-gray-300">Email notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded bg-livehub-hover border-livehub-border text-livehub-accent"
                />
                <span className="ml-3 text-gray-300">Stream notifications</span>
              </label>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="pt-4 border-t border-livehub-border">
            <h2 className="text-xl font-bold text-white mb-4">Privacy</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded bg-livehub-hover border-livehub-border text-livehub-accent"
                />
                <span className="ml-3 text-gray-300">Show profile publicly</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
