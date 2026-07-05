import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type {
    OllamaChatRequest,
    OllamaChatResponse,
    OllamaModelsResponse,
} from "@/features/home/types";

async function parseModelsResponse(response: Response): Promise<OllamaModelsResponse> {
    const rawText = await response.text();

    if (!response.ok) {
        throw new Error(rawText || "Failed to load models");
    }

    if (!rawText) {
        return { models: [], host: "127.0.0.1:8000" };
    }

    try {
        const parsed = JSON.parse(rawText) as
            | OllamaModelsResponse
            | { models?: Array<{ name?: string }> | string[]; host?: string };

        if (Array.isArray(parsed)) {
            return {
                models: parsed.map((entry) => ({ name: typeof entry === "string" ? entry : entry.name ?? "" })).filter((entry) => entry.name),
                host: "127.0.0.1:8000",
            };
        }

        const models = Array.isArray(parsed?.models)
            ? parsed.models
                .map((entry) => (typeof entry === "string" ? entry : entry?.name))
                .filter((value): value is string => Boolean(value))
            : [];

        return {
            models: models.map((name) => ({ name })),
            host: parsed?.host ?? "127.0.0.1:8000",
        };
    } catch {
        const fallbackModels = rawText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        return {
            models: fallbackModels.map((name) => ({ name })),
            host: "127.0.0.1:8000",
        };
    }
}

// The Next.js route acts as a bridge to the local Ollama process.
export const ollamaApi = createApi({
    reducerPath: "ollamaApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    tagTypes: ["Models"],
    endpoints: (builder) => ({
        getModels: builder.query<OllamaModelsResponse, void>({
            async queryFn() {
                try {
                    const response = await fetch("http://127.0.0.1:8000/models");
                    const data = await parseModelsResponse(response);
                    return { data };
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Failed to load models";
                    return {
                        error: { status: "CUSTOM_ERROR" as const, error: message },
                    };
                }
            },
            providesTags: ["Models"],
        }),
        sendChat: builder.mutation<OllamaChatResponse, OllamaChatRequest>({
            query: ({ model, messages, stream = false }) => ({
                url: "api/ollama/chat",
                method: "POST",
                body: { model, messages, stream },
            }),
            invalidatesTags: ["Models"],
        }),
    }),
});

export const { useGetModelsQuery, useSendChatMutation } = ollamaApi;
