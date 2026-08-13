"use client";

import React, { useState, useEffect } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useLocalParticipant,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, Mic, MicOff, Radio, Square } from "lucide-react";

interface CreatorBroadcastStudioProps {
  streamId: string;
  initialTitle: string;
}

function StudioControls({
  isLive,
  onGoLive,
  onEndStream,
}: {
  streamId: string;
  isLive: boolean;
  onGoLive: () => void;
  onEndStream: () => void;
}) {
  const { localParticipant } = useLocalParticipant();
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      const start = Date.now();
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const toggleMic = async () => {
    if (localParticipant) {
      const next = !micEnabled;
      await localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
    }
  };

  const toggleCam = async () => {
    if (localParticipant) {
      const next = !camEnabled;
      await localParticipant.setCameraEnabled(next);
      setCamEnabled(next);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-livehub-card p-4 rounded-xl border border-livehub-border">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isLive ? "bg-red-500 animate-pulse" : "bg-gray-500"
            }`}
          />
          <span className="font-semibold text-white">
            {isLive ? `LIVE (${formatTime(elapsed)})` : "OFFLINE (Preview)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMic}
            className={!micEnabled ? "bg-red-600/20 text-red-400" : ""}
          >
            {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleCam}
            className={!camEnabled ? "bg-red-600/20 text-red-400" : ""}
          >
            {camEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
          </Button>
          {!isLive ? (
            <Button variant="primary" size="sm" onClick={onGoLive}>
              <Radio size={16} className="mr-2" /> GO LIVE
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={onEndStream}>
              <Square size={16} className="mr-2" /> END STREAM
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CreatorBroadcastStudio({
  streamId,
}: CreatorBroadcastStudioProps) {
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setError(data.error || "Failed to get streaming token");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [streamId]);

  const handleGoLive = async () => {
    try {
      const res = await fetch(`/api/streams/${streamId}/lifecycle`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "go-live" }),
      });
      if (res.ok) {
        setIsLive(true);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to go live");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to go live");
    }
  };

  const handleEndStream = async () => {
    try {
      const res = await fetch(`/api/streams/${streamId}/lifecycle`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "end-stream" }),
      });
      if (res.ok) {
        setIsLive(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to end stream");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to end stream");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        Initializing broadcast studio...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-red-400">
        <p>Error: {error}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[75vh] min-h-[500px]">
      <LiveKitRoom
        video={true}
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
        <div className="p-4 bg-livehub-card border-t border-livehub-border">
          <StudioControls
            streamId={streamId}
            isLive={isLive}
            onGoLive={handleGoLive}
            onEndStream={handleEndStream}
          />
        </div>
      </LiveKitRoom>
    </div>
  );
}
