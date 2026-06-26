"use client";

import { ArrowUpIcon } from "lucide-react";
import { type FormEvent, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Message your local model…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!value.trim() || disabled) return;
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2",
          "focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-200",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-zinc-500 dark:focus-within:ring-zinc-800",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none",
            "placeholder:text-zinc-400 disabled:opacity-50",
            "dark:placeholder:text-zinc-500",
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !value.trim()}
          className="size-9 shrink-0 rounded-xl"
          aria-label="Send message"
        >
          <ArrowUpIcon className="size-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
        Press Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}
