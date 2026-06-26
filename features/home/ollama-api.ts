import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type {
    OllamaChatRequest,
    OllamaChatResponse,
    OllamaModelsResponse,
} from "@/features/home/types";

// The Next.js route acts as a bridge to the local Ollama process.
export const ollamaApi = createApi({
    reducerPath: "ollamaApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    tagTypes: ["Models"],
    endpoints: (builder) => ({
        getModels: builder.query<OllamaModelsResponse, void>({
            query: () => "api/ollama/models",
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
