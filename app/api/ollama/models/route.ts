import { listOllamaModels, OLLAMA_BASE_URL } from "@/lib/ollama";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const models = await listOllamaModels();
    return NextResponse.json({ models, host: OLLAMA_BASE_URL });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach Ollama";
    return NextResponse.json(
      {
        error: message,
        hint: "Ensure Ollama is running at " + OLLAMA_BASE_URL,
      },
      { status: 503 },
    );
  }
}
