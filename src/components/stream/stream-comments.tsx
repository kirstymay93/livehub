"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";

interface StreamCommentProps {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies?: StreamCommentProps[];
}

const StreamComment = ({
  id,
  authorName,
  authorAvatar,
  content,
  timestamp,
  likes,
  replies,
}: StreamCommentProps) => {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar
          src={authorAvatar}
          initials={authorName.slice(0, 2).toUpperCase()}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-white text-sm">{authorName}</p>
            <p className="text-xs text-gray-400">{formatDateTime(timestamp)}</p>
          </div>
          <p className="text-gray-200 text-sm break-words">{content}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Heart
                size={14}
                fill={isLiked ? "currentColor" : "none"}
                className={isLiked ? "text-livehub-accent" : ""}
              />
              {likes}
            </button>
            {session?.user && (
              <button className="text-xs text-gray-400 hover:text-white transition-colors">
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="ml-6 space-y-3 border-l border-livehub-border pl-3">
          {showReplies ? (
            replies.map((reply) => (
              <StreamComment key={reply.id} {...reply} />
            ))
          ) : (
            <button
              onClick={() => setShowReplies(true)}
              className="text-sm text-livehub-accent hover:text-livehub-accent-hover transition-colors"
            >
              Show {replies.length} repl{replies.length === 1 ? "y" : "ies"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface StreamCommentsProps {
  streamId: string;
  comments?: StreamCommentProps[];
}

const StreamComments = ({ streamId, comments = [] }: StreamCommentsProps) => {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    setIsSubmitting(true);
    try {
      // TODO: Submit comment to API
      setNewComment("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-white mb-6">Comments</h2>

      {/* Comment Input */}
      {session?.user ? (
        <form onSubmit={handleSubmitComment} className="mb-6 space-y-3">
          <div className="flex gap-3">
            <Avatar
              initials={session.user.username?.slice(0, 2).toUpperCase() || "U"}
              size="md"
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 bg-livehub-hover border border-livehub-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-livehub-accent resize-none"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setNewComment("")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!newComment.trim()}
            >
              Comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-gray-400 text-sm mb-6">Sign in to leave a comment</p>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm">No comments yet</p>
        ) : (
          comments.map((comment) => <StreamComment key={comment.id} {...comment} />)
        )}
      </div>
    </Card>
  );
};

export { StreamComments };
