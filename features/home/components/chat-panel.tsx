"use client";

import { AlertCircleIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatInput } from "@/features/home/components/chat-input";
import { ChatMessageBubble } from "@/features/home/components/chat-message-bubble";
import { useGetModelsQuery } from "@/features/home/ollama-api";
import type { HomeChatMessage, OllamaCompletionMetrics, OllamaGenerationSettings } from "@/features/home/types";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type OllamaStreamChunk = {
    message?: {
        content?: string;
        thinking?: string;
        reasoning?: string;
    };
    done?: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
    done_reason?: string;
};

const defaultGenerationSettings: OllamaGenerationSettings = {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 512,
    contextSize: 2048,
    thinkingMode: false,
    seed: "",
};

export function ChatPanel() {
    const [messages, setMessages] = useState<HomeChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [generationSettings, setGenerationSettings] = useState<OllamaGenerationSettings>(defaultGenerationSettings);
    const [error, setError] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const { data, isLoading: modelsLoading, error: modelsError } = useGetModelsQuery();

    const availableModels = data?.models ?? [];
    const modelsErrorMessage = modelsError
        ? "Could not reach the local Ollama service."
        : null;

    useEffect(() => {
        if (availableModels.length > 0 && !selectedModel) {
            setSelectedModel(availableModels[0].name);
        }
    }, [availableModels, selectedModel]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    function updateGenerationSetting<K extends keyof OllamaGenerationSettings>(key: K, value: OllamaGenerationSettings[K]) {
        setGenerationSettings((current) => ({ ...current, [key]: value }));
    }

    async function handleSend() {
        const content = input.trim();
        if (!content || !selectedModel || isStreaming) {
            return;
        }

        const userMessage: HomeChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content,
        };

        const assistantPlaceholder: HomeChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            reasoning: "",
        };

        const pendingMessages = [...messages, userMessage];

        // Keep a placeholder assistant bubble so the UI updates immediately while the model is still thinking.
        setMessages([...pendingMessages, assistantPlaceholder]);
        setInput("");
        setError(null);
        setIsStreaming(true);

        let assistantContent = "";
        let assistantReasoning = "";
        let assistantMetrics: OllamaCompletionMetrics | undefined;

        try {
            const response = await fetch("/api/ollama/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: pendingMessages.map(({ role, content }) => ({ role, content })),
                    stream: true,
                    think: generationSettings.thinkingMode,
                    options: {
                        temperature: generationSettings.temperature,
                        top_p: generationSettings.topP,
                        top_k: generationSettings.topK,
                        num_predict: generationSettings.maxOutputTokens,
                        num_ctx: generationSettings.contextSize,
                        seed: generationSettings.seed === "" ? undefined : Number(generationSettings.seed),
                    },
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.error ?? "The model request failed.");
            }

            if (!response.body) {
                throw new Error("The model did not return a readable stream.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            // Ollama streams NDJSON chunks, so we parse each line as it arrives and append any delta to the bubble.
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) {
                        continue;
                    }

                    const chunk = JSON.parse(trimmed) as OllamaStreamChunk;

                    const nextReasoning = chunk.message?.thinking ?? chunk.message?.reasoning ?? "";
                    const nextContent = chunk.message?.content ?? "";

                    if (nextReasoning) {
                        assistantReasoning += nextReasoning;
                    }

                    if (nextContent) {
                        assistantContent += nextContent;
                    }

                    if (chunk.done) {
                        assistantMetrics = {
                            totalDurationMs:
                                typeof chunk.total_duration === "number"
                                    ? Math.round(chunk.total_duration / 1_000_000)
                                    : undefined,
                            loadDurationMs:
                                typeof chunk.load_duration === "number"
                                    ? Math.round(chunk.load_duration / 1_000_000)
                                    : undefined,
                            promptEvalCount:
                                typeof chunk.prompt_eval_count === "number"
                                    ? chunk.prompt_eval_count
                                    : undefined,
                            promptEvalDurationMs:
                                typeof chunk.prompt_eval_duration === "number"
                                    ? Math.round(chunk.prompt_eval_duration / 1_000_000)
                                    : undefined,
                            evalCount:
                                typeof chunk.eval_count === "number"
                                    ? chunk.eval_count
                                    : undefined,
                            evalDurationMs:
                                typeof chunk.eval_duration === "number"
                                    ? Math.round(chunk.eval_duration / 1_000_000)
                                    : undefined,
                            tokensPerSecond:
                                typeof chunk.eval_count === "number" &&
                                    typeof chunk.eval_duration === "number"
                                    ? Number((chunk.eval_count / (chunk.eval_duration / 1_000_000_000)).toFixed(1))
                                    : undefined,
                            doneReason: chunk.done_reason,
                        };
                    }

                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last?.role !== "assistant") {
                            return prev;
                        }

                        updated[updated.length - 1] = {
                            ...last,
                            content: assistantContent,
                            reasoning: assistantReasoning,
                            metrics: assistantMetrics,
                        };
                        return updated;
                    });
                }
            }

            setMessages([
                ...pendingMessages,
                {
                    ...assistantPlaceholder,
                    content: assistantContent,
                    reasoning: assistantReasoning,
                    metrics: assistantMetrics,
                },
            ]);
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "The message could not be sent.";
            setError(message);
            setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                        ...last,
                        content: assistantContent,
                        reasoning: assistantReasoning,
                    };
                }
                return updated;
            });
        } finally {
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
                        ) : availableModels.length > 0 ? (
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableModels.map((model) => (
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
                            disabled={messages.length === 0 || isStreaming}
                        >
                            Clear
                        </Button>
                        <Dialog >
                            {/* The button that opens the drawer */}
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                >
                                    Settings
                                </Button>
                            </DialogTrigger>

                            {/* Portal renders the overlay and content at the root of the body */}
                            <DialogPortal>
                                <DialogOverlay />
                                <DialogContent className="max-w-4xl">

                                    <DialogTitle>
                                        Generation settings
                                    </DialogTitle>

                                    {/* <DialogDescription className="drawer-description">  */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                                        <p>These values are sent with your next request.</p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setGenerationSettings(defaultGenerationSettings)}
                                        >
                                            Reset
                                        </Button>
                                    </div>

                                    <div className="drawer-body">
                                        <div className="border-b border-zinc-200 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">

                                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                                    <Label htmlFor="temperature">Temperature</Label>
                                                    <Input
                                                        id="temperature"
                                                        type="number"
                                                        min="0"
                                                        max="2"
                                                        step="0.1"
                                                        value={generationSettings.temperature}
                                                        onChange={(event) => updateGenerationSetting("temperature", Number(event.target.value))}
                                                    />
                                                </div>

                                                <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                                    <Label htmlFor="top-p">Top P</Label>
                                                    <Input
                                                        id="top-p"
                                                        type="number"
                                                        min="0"
                                                        max="1"
                                                        step="0.05"
                                                        value={generationSettings.topP}
                                                        onChange={(event) => updateGenerationSetting("topP", Number(event.target.value))}
                                                    />
                                                </div>

                                                <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                                    <Label htmlFor="top-k">Top K</Label>
                                                    <Input
                                                        id="top-k"
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={generationSettings.topK}
                                                        onChange={(event) => updateGenerationSetting("topK", Number(event.target.value))}
                                                    />
                                                </div>

                                                <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                                    <Label htmlFor="num-predict">Max output tokens</Label>
                                                    <Input
                                                        id="num-predict"
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={generationSettings.maxOutputTokens}
                                                        onChange={(event) => updateGenerationSetting("maxOutputTokens", Number(event.target.value))}
                                                    />
                                                </div>

                                                <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                                    <Label htmlFor="num-ctx">Context size</Label>
                                                    <Input
                                                        id="num-ctx"
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={generationSettings.contextSize}
                                                        onChange={(event) => updateGenerationSetting("contextSize", Number(event.target.value))}
                                                    />
                                                </div>

                                                <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                                    <Label htmlFor="seed">Seed</Label>
                                                    <Input
                                                        id="seed"
                                                        type="number"
                                                        step="1"
                                                        value={generationSettings.seed}
                                                        onChange={(event) => updateGenerationSetting("seed", event.target.value === "" ? "" : Number(event.target.value))}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                                    <div>
                                                        <Label htmlFor="thinking-mode">Thinking mode</Label>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Enable model reasoning</p>
                                                    </div>
                                                    <Switch
                                                        id="thinking-mode"
                                                        checked={generationSettings.thinkingMode}
                                                        onCheckedChange={(checked) => updateGenerationSetting("thinkingMode", checked)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </DialogContent>
                            </DialogPortal>
                        </Dialog>
                    </div>
                </header>

                {(error ?? modelsErrorMessage) && (
                    <div className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                        <AlertCircleIcon className="size-4 shrink-0" />
                        <span>{error ?? modelsErrorMessage}</span>
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
                                        {availableModels.length > 0
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
                                        isStreaming={isStreaming && index === messages.length - 1 && message.role === "assistant"}
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
                    disabled={isStreaming || modelsLoading || !selectedModel || availableModels.length === 0}
                />
            </div>
        </TooltipProvider>
    );
}
