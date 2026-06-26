export interface OllamaModelOption {
    name: string;
}

export interface OllamaCompletionMetrics {
    totalDurationMs?: number;
    loadDurationMs?: number;
    promptEvalCount?: number;
    promptEvalDurationMs?: number;
    evalCount?: number;
    evalDurationMs?: number;
    tokensPerSecond?: number;
    doneReason?: string;
}

export interface OllamaGenerationSettings {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
    contextSize: number;
    thinkingMode: boolean;
    seed: number | "";
}

export interface HomeChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    reasoning?: string;
    metrics?: OllamaCompletionMetrics;
}

export interface OllamaModelsResponse {
    models: OllamaModelOption[];
    host: string;
}

export interface OllamaChatRequest {
    model: string;
    messages: Array<{
        role: "user" | "assistant";
        content: string;
    }>;
    stream?: boolean;
}

export interface OllamaChatResponse {
    message?: {
        role: "assistant";
        content: string;
    };
    done?: boolean;
}
