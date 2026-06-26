"use client";

import { BotIcon, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatMessageBubble({
  message,
  isStreaming = false,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "bg-transparent" : "bg-zinc-50/80 dark:bg-zinc-900/50",
      )}
    >
      <Avatar className="size-8">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
          )}
        >
          {isUser ? (
            <UserIcon className="size-4" />
          ) : (
            <BotIcon className="size-4" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {isUser ? "You" : "Assistant"}
        </p>
        <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {message.content || (isStreaming ? "…" : "")}
          {isStreaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-emerald-500" />
          )}
        </div>
      </div>
    </div>
  );
}
