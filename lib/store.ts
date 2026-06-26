import { configureStore } from "@reduxjs/toolkit";

import { ollamaApi } from "@/features/home/ollama-api";

export function makeStore() {
    return configureStore({
        reducer: {
            [ollamaApi.reducerPath]: ollamaApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(ollamaApi.middleware),
    });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
