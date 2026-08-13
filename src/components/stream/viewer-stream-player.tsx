"use client";

import React, { useState, useEffect } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Card } from "@/components/ui/card";
import { Radio } from "lucide-react";

interface ViewerStreamPlayerProps {
  streamId: string;
  status: string;
}

export function ViewerStreamPlayer({
  streamId,
  status,
}: ViewerStreamPlayerProps) {
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "LIVE") {
      setLoading(false);
      return;
    }

    fetch("/api/livekit/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ streamId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token && data.wsUrl) {
          setToken(data.token);
          setWsUrl(data.wsUrl);
        } else {
          setError(data.error || "Failed to join stream");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [streamId, status]);

  if (status === "OFFLINE") {
    return (
      <Card className="flex flex-col items-center justify-center p-12 h-[60vh] bg-livehub-card text-center">
        <Radio size={48} className="text-gray-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Stream is Offline</h2>
        <p className="text-gray-400 text-sm">
          This stream is currently offline. Please check back later!
        </p>
      </Card>
    );
  }

  if (status === "ENDED") {
    return (
      <Card className="flex flex-col items-center justify-center p-12 h-[60vh] bg-livehub-card text-center">
        <Radio size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Stream Has Ended</h2>
        <p className="text-gray-400 text-sm">
          This stream has concluded. Thank you for watching!
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-[60vh] text-gray-400 bg-livehub-card rounded-xl">
        Connecting to stream...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-red-400 h-[60vh] flex items-center justify-center">
        <p>Error: {error}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[70vh] min-h-[450px]">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={wsUrl}
        connect={true}
        className="flex flex-col flex-1 bg-black rounded-xl overflow-hidden border border-livehub-border relative"
      >
        <div className="flex-1 relative min-h-[400px]">
          <VideoConference />
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
