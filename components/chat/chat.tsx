"use client";

import { AlertCircleIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import {
  ChatMessageBubble,
  type ChatMessage,
} from "@/components/chat/chat-message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OllamaChatMessage } from "@/lib/ollama";

interface OllamaModelOption {
  name: string;
}

export function Chat() {
  const [models, setModels] = useState<OllamaModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  useEffect(() => {
    async function loadModels() {
      setModelsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ollama/models");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load models");
        }

        const loaded = (data.models ?? []) as OllamaModelOption[];
        setModels(loaded);

        if (loaded.length > 0) {
          setSelectedModel(loaded[0].name);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not connect to Ollama",
        );
      } finally {
        setModelsLoading(false);
      }
    }

    loadModels();
  }, []);

  async function handleSend() {
    const content = input.trim();
    if (!content || !selectedModel || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, assistantMessage]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    const apiMessages: OllamaChatMessage[] = nextMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      const response = await fetch("http://127.0.0.1:8000/chat/stream", {
        // const response = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Chat request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (!line.trim()) continue;

          const parsed = (() => {
            try {
              return JSON.parse(line) as {
                message?: { content?: string; reasoning?: string; thinking?: string };
                content?: string;
                reasoning?: string;
                thinking?: string;
              };
            } catch {
              return { content: line };
            }
          })();

          const delta = parsed.message?.content ?? parsed.content ?? line;
          if (delta) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + delta,
                };
              }
              return updated;
            });
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }

  function handleClear() {
    setMessages([]);
    setError(null);
  }

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              <SparklesIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Local LLM Chat
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Powered by Ollama on localhost
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {modelsLoading ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Loader2Icon className="size-4 animate-spin" />
                Loading models…
              </div>
            ) : models.length > 0 ? (
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={messages.length === 0 || isLoading}
            >
              Clear
            </Button>
          </div>
        </header>

        {error && (
          <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircleIcon className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex min-h-full flex-col">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  <SparklesIcon className="size-7 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Start a conversation
                  </p>
                  <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                    {models.length > 0
                      ? `Chat with ${selectedModel || "your model"} running locally via Ollama.`
                      : "Pull a model with ollama pull llama3.2 then refresh."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {messages.map((message, index) => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={
                      isStreaming &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <Separator />

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={
            isLoading || modelsLoading || !selectedModel || models.length === 0
          }
        />
      </div>
    </TooltipProvider>
  );
}
